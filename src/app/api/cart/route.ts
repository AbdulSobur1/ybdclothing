import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cartItems, productVariants, products } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";

/**
 * GET /api/cart — Fetch the current user's cart items with product details.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const items = await db
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

  return NextResponse.json({ items });
}

/**
 * POST /api/cart — Add item to cart (or increment quantity if already exists).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, variantId, quantity = 1 } = body;

  if (!productId || quantity < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Prevent admin from adding to cart
  if (await checkAdmin(user.id)) {
    return NextResponse.json({ error: "Admin accounts cannot place orders" }, { status: 403 });
  }

  // Check if the same item already exists in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, user.id),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : undefined,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Increment quantity
    await db
      .update(cartItems)
      .set({
        quantity: existing[0].quantity + quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    // Insert new item
    await db.insert(cartItems).values({
      userId: user.id,
      productId,
      variantId: variantId ?? null,
      quantity,
    });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/cart — Update item quantity.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { itemId, quantity } = body;

  if (!itemId || quantity < 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (quantity === 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)));
  } else {
    await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)));
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/cart — Remove an item from cart.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { itemId } = body;

  if (!itemId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)));

  return NextResponse.json({ success: true });
}
