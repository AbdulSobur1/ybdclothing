import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
import { eq, inArray, sql } from "drizzle-orm";

/**
 * POST /api/checkout — Create an order from the user's cart.
 *
 * Security: all prices are re-computed server-side from the database.
 * The client-submitted total is never trusted.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  // Fetch cart items
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

  // Validate all products exist and are active
  for (const item of cartItemsList) {
    if (!item.product || !item.product.active) {
      return NextResponse.json(
        { error: `Product "${item.product?.name ?? "unknown"}" is no longer available` },
        { status: 400 },
      );
    }

    // Check stock
    if (item.variant) {
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for "${item.product.name}" (${item.variant.color ?? ""} ${item.variant.size ?? ""}). Only ${item.variant.stockQuantity} left.`,
          },
          { status: 400 },
        );
      }
    }
  }

  // Calculate subtotal server-side from DB prices
  // Products were validated as non-null above, so assertion is safe.
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

  // Create the order (status starts at pending_verification — the customer
  // will upload a receipt later, but the order is placed immediately)
  const [newOrder] = await db
    .insert(orders)
    .values({
      userId: user.id,
      status: "pending_verification",
      deliveryMethod: deliveryMethod ?? null,
      deliveryZoneId: deliveryZoneId ?? null,
      deliveryFee: deliveryFee || null,
      deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : null,
      subtotal,
      total,
    })
    .returning();

  // Insert order items (snapshot product name + price)
  for (const item of cartItemsList) {
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: item.productId,
      variantId: item.variantId,
      nameSnapshot: item.product!.name,
      priceSnapshot: item.product!.basePrice,
      quantity: item.quantity,
    });
  }

  // Decrement stock (tradeoff: abandoned carts can temporarily lock stock,
  // but this is simpler and more correct than doing nothing)
  for (const item of cartItemsList) {
    if (item.variant) {
      await db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
        })
        .where(eq(productVariants.id, item.variant.id));
    }
  }

  // Clear the cart
  await db.delete(cartItems).where(eq(cartItems.userId, user.id));

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
    message: "Order placed successfully! We'll email you once confirmed.",
  });
}
