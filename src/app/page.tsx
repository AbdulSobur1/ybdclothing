import Link from "next/link";
import { CategoryCards } from "@/components/CategoryCards";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Load testimonials from DB — gracefully fall back to hardcoded defaults
  // if the table doesn't exist (migration not yet run) or DB is unavailable
  let displayedTestimonials = [
    { quote: "The quality of the tees is insane. I've been wearing mine constantly and it still looks brand new. Definitely my new go-to brand.", author: "Chidi O.", role: "Lagos", rating: 5 },
    { quote: "Ordered a cap and it arrived in 2 days. The fit is perfect, the embroidery is clean. YBD is doing something special here.", author: "Tunde A.", role: "Abuja", rating: 5 },
    { quote: "Finally, streetwear that actually fits well. I'm a bigger guy and the XXL tee fits perfectly. More brands need to take notes.", author: "Femi K.", role: "Port Harcourt", rating: 5 },
  ];

  try {
    const testimonialRows = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.active, true))
      .orderBy(desc(testimonials.createdAt));

    if (testimonialRows.length > 0) {
      displayedTestimonials = testimonialRows.slice(0, 3).map((t) => ({
        quote: t.quote,
        author: t.author,
        role: t.role ?? "",
        rating: t.rating ?? 5,
      }));
    }
  } catch {
    // DB query failed (table doesn't exist, etc.) — use hardcoded fallback
  }
  return (
    <div className="flex-1">
      {/* =============================== */}
      {/* HERO SECTION                    */}
      {/* =============================== */}
      <section className="relative bg-[#4A6B6D] text-white overflow-hidden min-h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A5557] via-[#4A6B6D] to-[#5A7B7D]" />

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-48 -left-48 w-[32rem] h-[32rem] rounded-full bg-white/[0.02]" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-[#A6822E]/10 blur-3xl" />

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
              <Link
                href="/shop"
                className="group inline-flex items-center px-6 py-3 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all shadow-lg hover:shadow-xl active:scale-[0.97]"
              >
                <span>Enter Store</span>
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-6 py-3 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Join YBD
              </Link>
            </div>
          </div>
        </div>

        {/* Floating scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* =============================== */}
      {/* CATEGORY SHORTCUTS              */}
      {/* =============================== */}
      <section className="bg-[#F2EDE1] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryCards />
        </div>
      </section>

      {/* =============================== */}
      {/* BRAND MANIFESTO / ABOUT         */}
      {/* =============================== */}
      <section className="relative bg-[#2C3E3F] text-white overflow-hidden py-16 sm:py-20">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#A6822E]/5 to-transparent" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[#A6822E]/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs text-[#C4A85D] font-medium mb-4 tracking-wider uppercase">
                About YBD
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-6 leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Born in Lagos.{" "}
                <span className="text-[#C4A85D]">Worn Everywhere.</span>
              </h2>
              <div className="space-y-4 text-[#D4CFC2] leading-relaxed">
                <p>
                  YBD is a premium clothing brand dedicated to creating timeless designs
                  that reflect confidence, purpose, and individuality. Every piece is
                  crafted to inspire self-expression while maintaining exceptional quality
                  and attention to detail.
                </p>
                <p>
                  First Gate, Ikorodu, Lagos State.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { value: "500+", label: "Happy Customers" },
                { value: "6+", label: "Products" },
                { value: "3", label: "Delivery Zones" },
                { value: "100%", label: "Quality Guaranteed" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <p className="text-3xl sm:text-4xl font-bold text-[#C4A85D] mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-[#B8B2A3]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =============================== */}
      {/* SOCIAL PROOF / TESTIMONIALS     */}
      {/* =============================== */}
      <section className="bg-[#F2EDE1] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs text-[#A6822E] font-semibold tracking-wider uppercase mb-2">
              Testimonials
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              What Our Customers Say
            </h2>
            <p className="text-[#8A9283] max-w-md mx-auto">
              Real reviews from real people who rock YBD.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedTestimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E0D8C8] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating ?? 5 }).map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-[#A6822E]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#5A5A4A] text-sm leading-relaxed mb-4 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#4A6B6D]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#4A6B6D]">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C2C2C]">{testimonial.author}</p>
                    <p className="text-xs text-[#8A9283]">{testimonial.role ?? ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================== */}
      {/* FINAL CTA — SPLIT LAYOUT       */}
      {/* =============================== */}
      <section className="relative bg-[#2C3E3F] overflow-hidden">
        {/* Decorative diagonal split */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4A6B6D] via-[#4A6B6D] to-[#3A5557]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#A6822E]/[0.03] skew-x-12 origin-top-right" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Ready to Level Up Your Style?
              </h2>
              <p className="text-[#D4CFC2] mb-8 max-w-md">
                Join the YBD movement. Premium streetwear, delivered to your doorstep. Quality
                craftsmanship, bold designs, and a community that stands out.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center px-8 py-3 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all shadow-lg hover:shadow-xl active:scale-[0.97]"
                >
                  Create Account
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center px-8 py-3 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  Browse Products
                </Link>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Premium Quality", desc: "100% cotton tees, structured caps" },
                { title: "Fast Delivery", desc: "2-5 days across all zones" },
                { title: "Secure Payment", desc: "Bank transfer with receipt verification" },
                { title: "Easy Returns", desc: "7-day return policy, no questions" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <p className="text-sm font-semibold text-white mb-1">{feature.title}</p>
                  <p className="text-xs text-[#B8B2A3]">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
