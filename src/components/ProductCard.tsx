"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import type { ProductWithVariants } from "@/types/product";
import { createClient } from "@/lib/supabase/client";

interface ProductCardProps {
  product: ProductWithVariants;
  onCartUpdated: () => void;
}

export function ProductCard({ product, onCartUpdated }: ProductCardProps) {
  const supabase = createClient();

  // Extract unique colors and sizes from variants
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];

  // State for selected variant attributes
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length > 0 ? colors[0] : null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length > 0 ? sizes[0] : null,
  );

  // Find the matching variant ID based on selected color and size
  const findMatchingVariant = () => {
    if (!product.hasVariants) {
      // Non-variant products have a single variant with all-null attributes
      return product.variants[0]?.id ?? null;
    }

    // Try exact match on color + size
    if (selectedColor && selectedSize) {
      const match = product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      );
      if (match) return match.id;
    }

    // Fallback: match on color only
    if (selectedColor) {
      const match = product.variants.find((v) => v.color === selectedColor);
      if (match) return match.id;
    }

    return product.variants[0]?.id ?? null;
  };

  const selectedVariantId = findMatchingVariant();
  const selectedV = product.variants.find((v) => v.id === selectedVariantId);
  const isSoldOut = selectedV ? selectedV.stockQuantity <= 0 : false;

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?redirect=/";
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          quantity: 1,
        }),
      });

      if (res.ok) {
        setAdded(true);
        onCartUpdated();
        setTimeout(() => setAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-[#E0D8C8]/50">
      {/* Image */}
      <div className="relative aspect-square bg-[#E8E2D4] overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[#4A6B6D]/10 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-[#4A6B6D]/40" />
              </div>
              <p className="text-xs text-[#8A9283]">{product.category}</p>
            </div>
          </div>
        )}

        {/* Category badge */}
        <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium bg-white/90 rounded-full text-[#4A6B6D] capitalize shadow-sm">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5">
        <h3
          className="text-lg font-semibold text-[#2C2C2C] mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {product.name}
        </h3>

        <p className="text-sm text-[#8A9283] mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <p className="text-xl font-bold text-[#4A6B6D] mb-3">
          {formatPrice(product.basePrice)}
        </p>

        {/* Variant selectors */}
        {product.hasVariants && (
          <div className="space-y-2 mb-3">
            {/* Color selector */}
            {colors.length > 0 && (
              <div>
                <p className="text-xs text-[#8A9283] mb-1.5">Color:</p>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        selectedColor === color
                          ? "bg-[#4A6B6D] text-white border-[#4A6B6D]"
                          : "border-[#D4CFC2] text-[#5A5A4A] hover:border-[#4A6B6D]"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div>
                <p className="text-xs text-[#8A9283] mb-1.5">Size:</p>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-8 h-8 flex items-center justify-center text-xs rounded-full border transition-all font-medium ${
                        selectedSize === size
                          ? "bg-[#4A6B6D] text-white border-[#4A6B6D]"
                          : "border-[#D4CFC2] text-[#5A5A4A] hover:border-[#4A6B6D]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={adding || isSoldOut}
          className={`w-full py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isSoldOut
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : added
                ? "bg-green-600 text-white"
                : "bg-[#4A6B6D] text-white hover:bg-[#3A5557] active:scale-[0.98]"
          }`}
        >
          {isSoldOut ? (
            "Sold Out"
          ) : added ? (
            <>
              <Check className="h-4 w-4" /> Added
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
