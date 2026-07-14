import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cartItems, orderItems, orders, productVariants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/cart/reorder — Re-add all items from a past order to the cart.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { orderId } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  // Verify the order belongs to this user
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Get order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  if (items.length === 0) {
    return NextResponse.json({ error: "Order has no items" }, { status: 400 });
  }

  // Add each item to cart (skip if product no longer exists, check stock)
  const results: { name: string; added: boolean; reason?: string }[] = [];

  for (const item of items) {
    // Check if variant still exists and has stock
    let stockAvailable = true;
    if (item.variantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);

      if (!variant || variant.stockQuantity < 1) {
        stockAvailable = false;
        results.push({
          name: item.nameSnapshot,
          added: false,
          reason: !variant ? "no longer available" : "out of stock",
        });
        continue;
      }
    }

    // Check if already in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, user.id),
          eq(cartItems.productId, item.productId),
          ...(item.variantId ? [eq(cartItems.variantId, item.variantId)] : []),
        ),
      )
      .limit(1);

    if (existing) {
      // Update quantity
      await db
        .update(cartItems)
        .set({ quantity: existing.quantity + item.quantity })
        .where(eq(cartItems.id, existing.id));
    } else {
      // Insert new cart item
      await db.insert(cartItems).values({
        userId: user.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }

    results.push({ name: item.nameSnapshot, added: true });
  }

  const addedCount = results.filter((r) => r.added).length;
  const skippedCount = results.filter((r) => !r.added).length;

  return NextResponse.json({
    success: true,
    addedCount,
    skippedCount,
    results,
    message: `${addedCount} item${addedCount !== 1 ? "s" : ""} added to cart${skippedCount > 0 ? `. ${skippedCount} item${skippedCount !== 1 ? "s" : ""} skipped (out of stock).` : ""}`,
  });
}
