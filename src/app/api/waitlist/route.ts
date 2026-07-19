import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { waitlistEntries, products, productVariants } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { withErrorHandling, requireContentType, validatePositiveInteger } from "@/lib/api-helpers";

/**
 * GET /api/waitlist — List the current user's waitlist entries with product details.
 */
export const GET = withErrorHandling(async function () {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const items = await db
    .select({
      id: waitlistEntries.id,
      productId: waitlistEntries.productId,
      variantId: waitlistEntries.variantId,
      createdAt: waitlistEntries.createdAt,
      product: products,
      variant: productVariants,
    })
    .from(waitlistEntries)
    .leftJoin(products, eq(waitlistEntries.productId, products.id))
    .leftJoin(productVariants, eq(waitlistEntries.variantId, productVariants.id))
    .where(eq(waitlistEntries.userId, user.id))
    .orderBy(waitlistEntries.createdAt);

  return NextResponse.json({ items });
});

/**
 * POST /api/waitlist — Add an item to the waitlist.
 * Idempotent: if already on the waitlist, returns success without duplicating.
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

  // Check if already on waitlist for this product + variant
  const existing = await db
    .select()
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.userId, user.id),
        eq(waitlistEntries.productId, productId),
        variantId ? eq(waitlistEntries.variantId, variantId) : isNull(waitlistEntries.variantId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Already on the list — return success without duplicating
    return NextResponse.json({ waitlisted: true, message: "Already on the waitlist" });
  }

  // Add to waitlist
  await db.insert(waitlistEntries).values({
    userId: user.id,
    productId,
    variantId: variantId ?? null,
  });

  return NextResponse.json({ waitlisted: true, message: "Added to waitlist" });
});

/**
 * DELETE /api/waitlist — Remove an item from the waitlist.
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
  const { productId, variantId } = body;

  const idError = validatePositiveInteger(productId, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  await db
    .delete(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.userId, user.id),
        eq(waitlistEntries.productId, productId),
        variantId ? eq(waitlistEntries.variantId, variantId) : isNull(waitlistEntries.variantId),
      ),
    );

  return NextResponse.json({ success: true });
});
