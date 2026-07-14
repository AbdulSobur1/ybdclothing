import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) notFound();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product || !product.active) notFound();

  const variants = product.hasVariants
    ? await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))
    : [];

  const productWithVariants = { ...product, variants };

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        {/* Breadcrumb */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm text-[#8A9283] hover:text-[#4A6B6D] mb-8 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shop
        </Link>

        <ProductDetailClient product={productWithVariants} />
      </div>
    </div>
  );
}
