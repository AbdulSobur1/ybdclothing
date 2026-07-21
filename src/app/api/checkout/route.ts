import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  cartItems,
  deliveryZones,
  orderItems,
  orders,
  products,
  productVariants,
  profiles,
} from "@/lib/db/schema";
import { config } from "@/lib/config";
import { sendNewOrderNotification } from "@/lib/email";
import { checkAdmin } from "@/lib/admin";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * POST /api/checkout — Create an order from the user's cart.
 *
 * Security:
 * - All prices are re-computed server-side from the database (never trust client prices).
 * - Stock validation + decrement happens inside a database transaction with
 *   SELECT ... FOR UPDATE to prevent concurrent overselling.
 * - The entire order creation is atomic — if anything fails, everything rolls back.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Prevent admin from placing orders
  if (await checkAdmin(user.id)) {
    return NextResponse.json({ error: "Admin accounts cannot place orders" }, { status: 403 });
  }

  const body = await request.json();
  const { deliveryMethod, deliveryZoneId, deliveryAddress, agreedToTerms } = body;

  // Validate terms agreement
  if (!agreedToTerms) {
    return NextResponse.json(
      { error: "You must agree to the Terms & Refund Policy" },
      { status: 400 },
    );
  }

  // Fetch user's profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch cart items (outside transaction — read-only, no contention)
  const cartItemsList = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      product: products,
      variant: productVariants,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.userId, user.id));

  // Guard: cart must not be empty
  if (cartItemsList.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate all products exist and are active (outside transaction — read-only)
  for (const item of cartItemsList) {
    if (!item.product || !item.product.active) {
      return NextResponse.json(
        { error: `Product "${item.product?.name ?? "unknown"}" is no longer available` },
        { status: 400 },
      );
    }
  }

  // Calculate subtotal server-side from DB prices
  const subtotal = cartItemsList.reduce((sum, item) => {
    return sum + (item.product!.basePrice * item.quantity);
  }, 0);

  // Calculate delivery fee
  let deliveryFee = 0;
  if (deliveryMethod === "delivery") {
    if (!deliveryZoneId || !deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery zone and address are required for delivery" },
        { status: 400 },
      );
    }

    const [zone] = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, deliveryZoneId))
      .limit(1);

    if (!zone || !zone.active) {
      return NextResponse.json({ error: "Invalid delivery zone" }, { status: 400 });
    }

    deliveryFee = zone.fee;
  }

  const total = subtotal + deliveryFee;

  // ── ATOMIC TRANSACTION ──
  // Stock check, order creation, stock decrement, and cart clear all happen
  // inside one transaction with row-level locking. If any step fails,
  // everything is rolled back — no partial orders, no phantom stock.
  const variantIdsToLock = cartItemsList
    .filter((item) => item.variant)
    .map((item) => item.variant!.id);

  let newOrder;
  try {
    newOrder = await db.transaction(async (tx) => {
      // 1. Lock variant rows to prevent concurrent decrements
      //    Use inArray for proper parameterized queries (sql.join needs SQL[] not raw numbers)
      if (variantIdsToLock.length > 0) {
        await tx.execute(
          sql`SELECT id FROM ${productVariants} WHERE ${inArray(productVariants.id, variantIdsToLock)} FOR UPDATE`,
        );
      }

      // 2. Read fresh stock values under lock
      const freshVariants = variantIdsToLock.length > 0
        ? await tx
            .select()
            .from(productVariants)
            .where(inArray(productVariants.id, variantIdsToLock))
        : [];

      const freshVariantMap = new Map(freshVariants.map((v) => [v.id, v]));

      // 3. Validate stock against locked values
      for (const item of cartItemsList) {
        if (item.variant) {
          const fresh = freshVariantMap.get(item.variant.id);
          const available = fresh?.stockQuantity ?? 0;
          if (available < item.quantity) {
            throw new Error(
              `Not enough stock for "${item.product!.name}" (${item.variant.color ?? ""} ${item.variant.size ?? ""}). Only ${available} left.`,
            );
          }
        }
      }

      // 4. Create the order (status starts at pending_payment — the customer
      //    must complete payment before the order can be verified)
      const [created] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          status: "pending_payment",
          deliveryMethod: deliveryMethod ?? null,
          deliveryZoneId: deliveryZoneId ?? null,
          deliveryFee: deliveryFee || null,
          deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : null,
          subtotal,
          total,
        })
        .returning();

      // 5. Insert order items (snapshot product name, price, and variant details)
      //    The variant snapshots survive even if a variant is later deleted.
      for (const item of cartItemsList) {
        await tx.insert(orderItems).values({
          orderId: created.id,
          productId: item.productId,
          variantId: item.variantId,
          nameSnapshot: item.product!.name,
          priceSnapshot: item.product!.basePrice,
          quantity: item.quantity,
          colorSnapshot: item.variant?.color ?? null,
          sizeSnapshot: item.variant?.size ?? null,
          imageSnapshot: item.product!.imageUrl ?? null,
        });
      }

      // 6. Decrement stock
      for (const item of cartItemsList) {
        if (item.variant) {
          await tx
            .update(productVariants)
            .set({
              stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
            })
            .where(eq(productVariants.id, item.variant.id));
        }
      }

      // 7. Clear the cart
      await tx.delete(cartItems).where(eq(cartItems.userId, user.id));

      return created;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Send notification to owner (fire-and-forget — don't block the response)
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/orders/${newOrder.id}`;
  sendNewOrderNotification({
    orderId: newOrder.id,
    customerName: profile.fullName,
    customerEmail: profile.email,
    total,
    adminUrl,
  });

  return NextResponse.json({
    orderId: newOrder.id,
    total,
    message: "Order placed successfully! Please complete your bank transfer to activate your order.",
  });
}
