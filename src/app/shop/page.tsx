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
        {/* Page header */}
        <div className="text-center mb-12">
          <p className="text-xs text-[#A6822E] font-semibold tracking-wider uppercase mb-2">
            Collection
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            All Products
          </h1>
          <p className="text-[#8A9283] max-w-md mx-auto">
            Premium streetwear crafted for those who make a statement.
          </p>
        </div>

        {/* Quick links */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <a
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E0D8C8] text-sm font-medium text-[#5A5A4A] hover:border-[#4A6B6D] hover:text-[#4A6B6D] transition-all shadow-sm"
          >
            My Orders
          </a>
          <a
            href="/checkout"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A6B6D] text-white text-sm font-medium hover:bg-[#3A5557] transition-all shadow-sm"
          >
            View Cart
          </a>
        </div>

        <StorefrontClient products={productList} />
      </div>
    </div>
  );
}
