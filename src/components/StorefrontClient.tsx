"use client";

import { useState, useCallback } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { ProductWithVariants } from "@/types/product";

interface StorefrontClientProps {
  products: ProductWithVariants[];
}

export function StorefrontClient({ products }: StorefrontClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const handleCartUpdated = useCallback(async () => {
    setRefreshKey((k) => k + 1);
    // Fetch updated cart count
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCartCount(data.items?.length ?? 0);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {["all", "cap", "tee", "hat"].map((cat) => (
          <a
            key={cat}
            href={cat === "all" ? "#products" : `#products?category=${cat}`}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-[#E0D8C8] text-[#5A5A4A] hover:border-[#4A6B6D] hover:text-[#4A6B6D] transition-all capitalize"
          >
            {cat === "all" ? "All" : cat}
          </a>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={`${product.id}-${refreshKey}`}
            product={product}
            onCartUpdated={handleCartUpdated}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#8A9283] text-lg">No products available yet.</p>
          <p className="text-[#B8B2A3] text-sm mt-2">Check back soon!</p>
        </div>
      )}
    </div>
  );
}
