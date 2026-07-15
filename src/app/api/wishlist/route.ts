import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { wishlistItems, products, productVariants } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { withErrorHandling, validatePositiveInteger, requireContentType } from "@/lib/api-helpers";

/**
 * GET /api/wishlist — List the current user's wishlist items with product details.
 */
export const GET = withErrorHandling(async function () {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const items = await db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
      variantId: wishlistItems.variantId,
      createdAt: wishlistItems.createdAt,
      product: products,
      variant: productVariants,
    })
    .from(wishlistItems)
    .leftJoin(products, eq(wishlistItems.productId, products.id))
    .leftJoin(productVariants, eq(wishlistItems.variantId, productVariants.id))
    .where(eq(wishlistItems.userId, user.id))
    .orderBy(wishlistItems.createdAt);

  return NextResponse.json({ items });
});

/**
 * POST /api/wishlist — Add an item to the wishlist.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, variantId } = body;

  const idError = validatePositiveInteger(productId, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  // Check if already wishlisted
  const existing = await db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, user.id),
        eq(wishlistItems.productId, productId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Already in wishlist — remove it (toggle behavior)
    await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.id, existing[0].id));

    return NextResponse.json({ wishlisted: false, message: "Removed from wishlist" });
  }

  // Add to wishlist
  await db.insert(wishlistItems).values({
    userId: user.id,
    productId,
    variantId: variantId ?? null,
  });

  return NextResponse.json({ wishlisted: true, message: "Added to wishlist" });
});

/**
 * DELETE /api/wishlist — Remove an item from the wishlist.
 */
export const DELETE = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { productId } = body;

  const idError = validatePositiveInteger(productId, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, user.id),
        eq(wishlistItems.productId, productId),
      ),
    );

  return NextResponse.json({ success: true });
});
