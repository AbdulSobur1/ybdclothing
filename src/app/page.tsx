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
      <section className="relative bg-[#4A6B6D] text-white overflow-hidden min-h-[70vh] flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A5557] via-[#4A6B6D] to-[#5A7B7D]" />

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-48 -left-48 w-[32rem] h-[32rem] rounded-full bg-white/[0.02]" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-[#A6822E]/10 blur-3xl" />

        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="max-w-2xl">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-sm text-[#D4CFC2] mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#A6822E] mr-2 animate-pulse-soft" />
              New Collection
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 animate-fade-in"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Streetwear That
              <br />
              <span className="text-[#C4A85D]">Defines You</span>
            </h1>
            <p
              className="text-lg text-[#D4CFC2] mb-8 max-w-lg animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            >
              Premium caps, tees, and hats for those who dare to stand out. Bold designs,
              quality craftsmanship.
            </p>
            <div
              className="flex flex-wrap gap-3 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <a
                href="#products"
                className="group inline-flex items-center px-6 py-3 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all shadow-lg hover:shadow-xl active:scale-[0.97]"
              >
                <span>Shop Now</span>
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="/auth/signup"
                className="inline-flex items-center px-6 py-3 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Join YBD
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
