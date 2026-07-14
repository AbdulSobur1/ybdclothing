import Link from "next/link";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { StorefrontClient } from "@/components/StorefrontClient";

// Page requires DB queries — render dynamically
export const dynamic = "force-dynamic";

async function getProducts() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.createdAt);

  const productsWithVariants = await Promise.all(
    allProducts.map(async (product) => {
      const variants = product.hasVariants
        ? await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, product.id))
        : [];

      return { ...product, variants };
    }),
  );

  return productsWithVariants;
}

export default async function ShopPage() {
  const productList = await getProducts();

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#8A9283] hover:text-[#4A6B6D] mb-6 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>

        {/* Page header — compact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] text-[#A6822E] font-semibold tracking-wider uppercase mb-1">
              Collection
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              All Products
            </h1>
            <p className="text-sm text-[#8A9283] mt-1">
              Premium streetwear crafted for those who make a statement.
            </p>
          </div>
          {/* Utility links — secondary, moved to top-right */}
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E0D8C8] text-xs font-medium text-[#8A9283] hover:text-[#4A6B6D] hover:border-[#4A6B6D] transition-all"
            >
              My Orders
            </Link>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A6B6D] text-white text-xs font-medium hover:bg-[#3A5557] transition-all shadow-sm"
            >
              View Cart
            </Link>
          </div>
        </div>

        <StorefrontClient products={productList} />
      </div>
    </div>
  );
}
