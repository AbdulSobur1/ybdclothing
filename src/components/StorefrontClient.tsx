"use client";

import { useState, useCallback, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingBag } from "lucide-react";
import type { ProductWithVariants } from "@/types/product";

interface StorefrontClientProps {
  products: ProductWithVariants[];
}

const CATEGORIES = [
  { value: "all", label: "All Products" },
  { value: "cap", label: "Caps" },
  { value: "tee", label: "Tees" },
  { value: "hat", label: "Hats" },
] as const;

export function StorefrontClient({ products }: StorefrontClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const handleCartUpdated = useCallback(async () => {
    // Cart badge in Navbar will refresh on next navigation
  }, []);

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
              activeCategory === cat.value
                ? "bg-[#4A6B6D] text-white shadow-sm"
                : "bg-white border border-[#E0D8C8] text-[#5A5A4A] hover:border-[#4A6B6D] hover:text-[#4A6B6D]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ProductCard
              product={product}
              onCartUpdated={handleCartUpdated}
            />
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4A6B6D]/10 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-[#4A6B6D]/40" />
          </div>
          <p className="text-[#8A9283] text-lg">No products in this category yet.</p>
          <button
            onClick={() => setActiveCategory("all")}
            className="mt-3 px-5 py-2 rounded-full bg-[#4A6B6D] text-white text-sm font-medium hover:bg-[#3A5557] transition-all"
          >
            View All Products
          </button>
        </div>
      )}
    </div>
  );
}


