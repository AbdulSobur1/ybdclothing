import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { StorefrontClient } from "@/components/StorefrontClient";

// Page requires DB queries — render dynamically, not at build time
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

export default async function HomePage() {
  const productList = await getProducts();

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative bg-[#4A6B6D] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A5557] via-[#4A6B6D] to-[#5A7B7D]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-sm text-[#D4CFC2] mb-4">
              New Collection
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Streetwear That
              <br />
              <span className="text-[#C4A85D]">Defines You</span>
            </h1>
            <p className="text-lg text-[#D4CFC2] mb-8 max-w-lg">
              Premium caps, tees, and hats for those who dare to stand out. Bold designs,
              quality craftsmanship.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center px-6 py-3 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all"
              >
                Shop Now
              </a>
              <a
                href="#products"
                className="inline-flex items-center px-6 py-3 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition-all"
              >
                View Collection
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="bg-[#F2EDE1] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              All Products
            </h2>
            <p className="text-[#8A9283] max-w-md mx-auto">
              Premium streetwear crafted for those who make a statement.
            </p>
          </div>

          <StorefrontClient products={productList} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#4A6B6D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Ready to Level Up Your Style?
          </h2>
          <p className="text-[#D4CFC2] mb-8 max-w-md mx-auto">
            Join the YBD movement. Premium streetwear, delivered to your doorstep.
          </p>
          <a
            href="/auth/signup"
            className="inline-flex items-center px-8 py-3 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all"
          >
            Create Account
          </a>
        </div>
      </section>
    </div>
  );
}
