"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Check, Loader2, Heart, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import type { ProductWithVariants } from "@/types/product";
import { createClient } from "@/lib/supabase/client";

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
  const isSoldOut = selectedV ? selectedV.stockQuantity <= 0 : false;

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(false);
  const [waitlisting, setWaitlisting] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitlistError, setWaitlistError] = useState(false);

  // Check wishlist status on mount
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          const isWishlisted = data.items?.some((i: any) => i.productId === product.id);
          setWishlisted(isWishlisted);
        }
      } catch {}
    };
    checkWishlist();
  }, [product.id]);

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
      } else {
        const data = await res.json().catch(() => ({}));
        setWaitlistError(true);
        setTimeout(() => setWaitlistError(false), 3000);
        console.error("Waitlist API error:", data.error || res.statusText);
      }
    } catch {
      setWaitlistError(true);
      setTimeout(() => setWaitlistError(false), 3000);
    } finally {
      setWaitlisting(false);
    }
  };

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
        onCartUpdated();
        window.dispatchEvent(new CustomEvent("cart-updated"));
        setTimeout(() => setAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?redirect=/shop";
      return;
    }
    setWishlistLoading(true);
    setWishlistError(false);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariantId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
      } else {
        setWishlistError(true);
        setTimeout(() => setWishlistError(false), 3000);
      }
    } catch {
      setWishlistError(true);
      setTimeout(() => setWishlistError(false), 3000);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#E0D8C8]/50 hover:-translate-y-1">
      {/* Image — clickable to detail page */}
      <div className="relative aspect-square bg-[#E8E2D4] overflow-hidden">
        <Link href={`/shop/${product.id}`} className="block w-full h-full">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8E2D4] to-[#DDD6C8]">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                  <ShoppingBag className="h-6 w-6 text-[#B8B2A3]" />
                </div>
                <p className="text-xs font-medium text-[#B8B2A3] capitalize">{product.category}</p>
                <p className="text-[10px] text-[#C4BEB0] mt-0.5">Image coming soon</p>
              </div>
            </div>
          )}

          {/* Category badge — only show on image if image exists */}
          {product.imageUrl && (
            <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-[#4A6B6D] capitalize shadow-sm">
              {product.category}
            </span>
          )}
        </Link>

        {/* Wishlist heart — positioned inside the container but OUTSIDE the Link */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all z-10 ${
            wishlisted
              ? "hover:bg-rose-50"
              : wishlistError
                ? "bg-red-50"
                : "hover:bg-rose-50 opacity-0 group-hover:opacity-100"
          }`}
          title={wishlistError ? "Failed — try again" : wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wishlistLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
          ) : wishlistError ? (
            <span className="text-[10px] font-medium text-red-500">!</span>
          ) : (
            <Heart
              className={`h-4 w-4 transition-colors ${
                wishlisted ? "text-rose-500 fill-rose-500" : "text-[#8A9283] hover:text-rose-400"
              }`}
            />
          )}
        </button>

        {/* Quick-add overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5">
        {/* Category badge below image when no image */}
        {!product.imageUrl && (
          <span className="inline-flex mb-2 px-2.5 py-0.5 text-[11px] font-medium bg-[#4A6B6D]/10 text-[#4A6B6D] rounded-full capitalize">
            {product.category}
          </span>
        )}
        <Link
          href={`/shop/${product.id}`}
          className="block"
        >
          <h3
            className="text-lg font-semibold text-[#2C2C2C] mb-1 group-hover:text-[#4A6B6D] transition-colors"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {product.name}
          </h3>
        </Link>

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
            {/* Color selector with swatches */}
            {colors.length > 0 && (
              <div>
                <p className="text-xs text-[#8A9283] mb-1.5">
                  Color: <span className="text-[#2C2C2C] font-medium">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? "border-[#4A6B6D] scale-110 shadow-md"
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
                <p className="text-xs text-[#8A9283] mb-1.5">
                  Size: <span className="text-[#2C2C2C] font-medium">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-9 h-9 flex items-center justify-center text-xs rounded-lg border-2 transition-all duration-200 font-medium ${
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

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={adding || isSoldOut}
            className={`w-full py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
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
                <Check className="h-4 w-4" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </>
            )}
          </button>

          {/* Add to waitlist button */}
          <button
            onClick={handleAddToWaitlist}
            disabled={waitlisting}
            className={`w-full py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 border ${
              waitlisted
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : waitlistError
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "border-[#A6822E] text-[#A6822E] hover:bg-[#A6822E]/5 active:scale-[0.97]"
            }`}
          >
            {waitlisting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : waitlisted ? (
              <>
                <Check className="h-3.5 w-3.5" /> You&apos;re on the list ✓
              </>
            ) : waitlistError ? (
              <span>Failed — try again</span>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5" /> Add to Waitlist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
