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
 * Resolve the variant for a cart operation.
 * If variantId is provided, look it up directly.
 * Otherwise, fall back to the first variant of the product (for non-variant products).
 * Returns the variant row and the normalized variantId to use in queries.
 */
async function resolveVariant(
  productId: number,
  variantId: number | null | undefined,
): Promise<{ variant: typeof productVariants.$inferSelect | null; resolvedVariantId: number | null }> {
  if (variantId) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);
    return { variant: variant ?? null, resolvedVariantId: variantId };
  }

  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .limit(1);

  return { variant: variant ?? null, resolvedVariantId: variant?.id ?? null };
}

/**
 * POST /api/cart — Add item to cart (or increment quantity if already exists).
 * Stock validation: prevents adding more than available stock.
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
  const { productId, variantId: rawVariantId, quantity = 1 } = body;

  const idError = validatePositiveInteger(productId, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  // Validate variantId if provided (can be null/undefined for non-variant products)
  if (rawVariantId !== undefined && rawVariantId !== null) {
    const vErr = validatePositiveInteger(rawVariantId, "Variant ID");
    if (vErr) {
      return NextResponse.json({ error: vErr }, { status: 400 });
    }
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
  }

  // ── Stock validation ──
  // Resolve the variant (single DB call, reused below)
  const { variant, resolvedVariantId } = await resolveVariant(productId, rawVariantId);

  if (variant && variant.stockQuantity < 1) {
    return NextResponse.json(
      { error: "This item is currently out of stock" },
      { status: 400 },
    );
  }

  if (variant && variant.stockQuantity < quantity) {
    return NextResponse.json(
      {
        error: `Only ${variant.stockQuantity} item${variant.stockQuantity !== 1 ? "s" : ""} available. You requested ${quantity}.`,
      },
      { status: 400 },
    );
  }

  // Check if the same item already exists in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, user.id),
        eq(cartItems.productId, productId),
        resolvedVariantId ? eq(cartItems.variantId, resolvedVariantId) : undefined,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Increment quantity — check stock against total (existing + new)
    const totalQty = existing[0].quantity + quantity;

    if (variant && totalQty > variant.stockQuantity) {
      const canAddMore = Math.max(0, variant.stockQuantity - existing[0].quantity);
      return NextResponse.json(
        {
          error: canAddMore > 0
            ? `Only ${canAddMore} more item${canAddMore !== 1 ? "s" : ""} available. You already have ${existing[0].quantity} in your cart.`
            : "No more stock available. You already have all available items in your cart.",
        },
        { status: 400 },
      );
    }

    await db
      .update(cartItems)
      .set({
        quantity: totalQty,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    // Insert new item
    await db.insert(cartItems).values({
      userId: user.id,
      productId,
      variantId: resolvedVariantId,
      quantity,
    });
  }

  return NextResponse.json({ success: true });
});

/**
 * PATCH /api/cart — Update item quantity.
 * Stock validation: prevents setting quantity higher than available stock.
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

    return NextResponse.json({ success: true });
  }

  // ── Stock validation ──
  // Look up the cart item to find the variant, then check stock
  const [cartItem] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)))
    .limit(1);

  if (!cartItem) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  // Resolve the variant for stock check (handles both variantId and fallback)
  const { variant } = await resolveVariant(cartItem.productId, cartItem.variantId);

  if (variant && quantity > variant.stockQuantity) {
    return NextResponse.json(
      {
        error: `Only ${variant.stockQuantity} item${variant.stockQuantity !== 1 ? "s" : ""} available. You requested ${quantity}.`,
      },
      { status: 400 },
    );
  }

  await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)));

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
