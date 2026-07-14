"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingBag,
  Check,
  Loader2,
  Heart,
  Clock,
  Package,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { ProductWithVariants } from "@/types/product";

// Map color names to hex values for swatches
const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  navy: "#1B2A4A",
  gray: "#6B7280",
  grey: "#6B7280",
  red: "#DC2626",
  maroon: "#800000",
  green: "#16A34A",
  olive: "#808000",
  blue: "#2563EB",
  cream: "#FFFDD0",
  beige: "#F5F5DC",
  brown: "#8B4513",
  gold: "#A6822E",
  yellow: "#EAB308",
  orange: "#EA580C",
  purple: "#9333EA",
  pink: "#EC4899",
};

function getHexColor(color: string): string {
  return COLOR_MAP[color.toLowerCase()] ?? "#888888";
}

function getStockStatus(quantity: number): { label: string; color: string } {
  if (quantity <= 0) return { label: "Sold Out", color: "text-red-500 bg-red-50" };
  if (quantity <= 5) return { label: "Low Stock", color: "text-amber-600 bg-amber-50" };
  return { label: "In Stock", color: "text-emerald-600 bg-emerald-50" };
}

interface ProductDetailClientProps {
  product: ProductWithVariants;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];

  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length > 0 ? colors[0] : null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length > 0 ? sizes[0] : null,
  );

  const findMatchingVariant = () => {
    if (!product.hasVariants) {
      return product.variants[0]?.id ?? null;
    }
    if (selectedColor && selectedSize) {
      const match = product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      );
      if (match) return match.id;
    }
    if (selectedColor) {
      const match = product.variants.find((v) => v.color === selectedColor);
      if (match) return match.id;
    }
    return product.variants[0]?.id ?? null;
  };

  const selectedVariantId = findMatchingVariant();
  const selectedV = product.variants.find((v) => v.id === selectedVariantId);
  const stockQty = selectedV?.stockQuantity ?? 0;
  const isSoldOut = stockQty <= 0;
  const stockStatus = getStockStatus(stockQty);

  // Cart state
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Waitlist state
  const [waitlisting, setWaitlisting] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);

  // Wishlist state
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?redirect=/shop";
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
        window.dispatchEvent(new CustomEvent("cart-updated"));
        setTimeout(() => setAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleAddToWaitlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?redirect=/shop";
      return;
    }

    setWaitlisting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
        }),
      });
      if (res.ok) {
        setWaitlisted(true);
        setTimeout(() => setWaitlisted(false), 3000);
      }
    } finally {
      setWaitlisting(false);
    }
  };

  const handleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?redirect=/shop";
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariantId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* ── Image ── */}
      <div className="relative aspect-square bg-[#E8E2D4] rounded-2xl overflow-hidden shadow-lg">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8E2D4] to-[#DDD6C8]">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/70 flex items-center justify-center shadow-md">
                <Package className="h-10 w-10 text-[#B8B2A3]" />
              </div>
              <p className="text-sm font-medium text-[#B8B2A3] capitalize">{product.category}</p>
              <p className="text-xs text-[#C4BEB0] mt-1">Image coming soon</p>
            </div>
          </div>
        )}

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-rose-50 transition-all"
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wishlistLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
          ) : (
            <Heart
              className={`h-5 w-5 transition-colors ${
                wishlisted ? "text-rose-500 fill-rose-500" : "text-[#8A9283] hover:text-rose-400"
              }`}
            />
          )}
        </button>
      </div>

      {/* ── Product Info ── */}
      <div className="flex flex-col justify-center">
        {/* Category */}
        <span className="inline-flex self-start mb-3 px-3 py-1 text-xs font-medium bg-[#4A6B6D]/10 text-[#4A6B6D] rounded-full capitalize">
          {product.category}
        </span>

        {/* Name */}
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {product.name}
        </h1>

        {/* Price */}
        <p className="text-2xl font-bold text-[#4A6B6D] mb-6">
          {formatPrice(product.basePrice)}
        </p>

        {/* Description — full, no truncation */}
        {product.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-2">
              Description
            </h2>
            <p className="text-[#5A5A4A] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Variant Selectors */}
        {product.hasVariants && (
          <div className="space-y-4 mb-6">
            {/* Color selector */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#5A5A4A] mb-2">
                  Color: <span className="text-[#2C2C2C]">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? "border-[#4A6B6D] scale-110 shadow-md ring-2 ring-[#4A6B6D]/20"
                          : "border-[#D4CFC2] hover:scale-110"
                      }`}
                      style={{ backgroundColor: getHexColor(color) }}
                      title={color}
                      aria-label={`Select ${color} color`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#5A5A4A] mb-2">
                  Size: <span className="text-[#2C2C2C]">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg border-2 transition-all duration-200 font-medium ${
                        selectedSize === size
                          ? "bg-[#4A6B6D] text-white border-[#4A6B6D] shadow-sm"
                          : "border-[#D4CFC2] text-[#5A5A4A] hover:border-[#4A6B6D] hover:text-[#4A6B6D]"
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

        {/* Stock Status */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${stockStatus.color}`}>
            <Package className="h-4 w-4" />
            {stockStatus.label} {stockQty > 0 && `(Qty: ${stockQty})`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={adding || isSoldOut}
            className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isSoldOut
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : added
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#4A6B6D] text-white hover:bg-[#3A5557] active:scale-[0.97] shadow-sm hover:shadow-md"
            }`}
          >
            {isSoldOut ? (
              "Sold Out"
            ) : adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : added ? (
              <>
                <Check className="h-4 w-4" /> Added!
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </>
            )}
          </button>

          {/* Add to Waitlist */}
          <button
            onClick={handleAddToWaitlist}
            disabled={waitlisting}
            className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border ${
              waitlisted
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "border-[#A6822E] text-[#A6822E] hover:bg-[#A6822E]/5 active:scale-[0.97]"
            }`}
          >
            {waitlisting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : waitlisted ? (
              <>
                <Check className="h-4 w-4" /> You&apos;re on the list ✓
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" /> Add to Waitlist
              </>
            )}
          </button>
        </div>

        {/* Payment reminder */}
        <div className="bg-white rounded-xl p-4 border border-[#E0D8C8]">
          <p className="text-xs text-[#8A9283]">
            Complete your purchase via bank transfer. After ordering, upload your payment receipt for verification.
          </p>
        </div>
      </div>
    </div>
  );
}
