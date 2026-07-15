import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";
import { withErrorHandling, validatePositiveInteger, requireContentType } from "@/lib/api-helpers";

/**
 * GET /api/admin/products — List all products with variant info.
 */
export const GET = withErrorHandling(async function () {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  const productsWithDetails = await Promise.all(
    allProducts.map(async (product) => {
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id));
      return { ...product, variants };
    }),
  );

  return NextResponse.json({ products: productsWithDetails });
});

/**
 * POST /api/admin/products — Create a new product with variants.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { name, description, basePrice, category, hasVariants, imageUrl, variants } = body;

  if (!name || !basePrice || !category) {
    return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
  }

  const [newProduct] = await db
    .insert(products)
    .values({
      name,
      description: description || null,
      basePrice: Math.round(basePrice),
      category,
      hasVariants: hasVariants ?? false,
      imageUrl: imageUrl || null,
      active: true,
    })
    .returning();

  if (hasVariants && variants?.length > 0) {
    await db.insert(productVariants).values(
      variants.map((v: { color?: string; size?: string; stockQuantity?: number; sku?: string }) => ({
        productId: newProduct.id,
        color: v.color || null,
        size: v.size || null,
        stockQuantity: v.stockQuantity ?? 0,
        sku: v.sku || null,
      })),
    );
  } else {
    await db.insert(productVariants).values({
      productId: newProduct.id,
      stockQuantity: 999,
    });
  }

  return NextResponse.json({ product: newProduct }, { status: 201 });
});

/**
 * PUT /api/admin/products — Update a product (requires id in body).
 */
export const PUT = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, name, description, basePrice, category, hasVariants, imageUrl, active, variants } = body;

  const idError = validatePositiveInteger(id, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  await db
    .update(products)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(basePrice !== undefined && { basePrice: Math.round(basePrice) }),
      ...(category !== undefined && { category }),
      ...(hasVariants !== undefined && { hasVariants }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(active !== undefined && { active }),
    })
    .where(eq(products.id, id));

  if (variants) {
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    if (variants.length > 0) {
      await db.insert(productVariants).values(
        variants.map((v: { color?: string; size?: string; stockQuantity?: number; sku?: string }) => ({
          productId: id,
          color: v.color || null,
          size: v.size || null,
          stockQuantity: v.stockQuantity ?? 0,
          sku: v.sku || null,
        })),
      );
    }
  }

  return NextResponse.json({ success: true });
});

/**
 * DELETE /api/admin/products — Delete a product (requires id in body).
 */
export const DELETE = withErrorHandling(async function (request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;

  const idError = validatePositiveInteger(id, "Product ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  await db.delete(products).where(eq(products.id, id));

  return NextResponse.json({ success: true });
});
