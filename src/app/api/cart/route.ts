import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cartItems, productVariants, products } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { withErrorHandling, requireContentType, validatePositiveInteger } from "@/lib/api-helpers";

/**
 * GET /api/cart — Fetch the current user's cart items with product details.
 */
export const GET = withErrorHandling(async function () {
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
});

/**
 * POST /api/cart — Add item to cart (or increment quantity if already exists).
 */
export const POST = withErrorHandling(async function (request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const body = await request.json();
  const { productId, variantId, quantity = 1 } = body;

  const idError = validatePositiveInteger(productId, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
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
});

/**
 * PATCH /api/cart — Update item quantity.
 */
export const PATCH = withErrorHandling(async function (request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const body = await request.json();
  const { itemId, quantity } = body;

  const idError = validatePositiveInteger(itemId, "Item ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  if (quantity < 0 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "Quantity must be a non-negative integer" }, { status: 400 });
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
});

/**
 * DELETE /api/cart — Remove an item from cart.
 */
export const DELETE = withErrorHandling(async function (request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const body = await request.json();
  const { itemId } = body;

  const idError = validatePositiveInteger(itemId, "Item ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)));

  return NextResponse.json({ success: true });
});
