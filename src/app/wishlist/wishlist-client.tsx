"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Heart, ShoppingBag, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface WishlistItem {
  id: number;
  productId: number;
  variantId: number | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    description: string | null;
    basePrice: number;
    category: string;
    imageUrl: string | null;
    hasVariants: boolean;
  } | null;
  variant: {
    id: number;
    color: string | null;
    size: string | null;
    stockQuantity: number;
  } | null;
}

interface WishlistClientProps {
  items: WishlistItem[];
}

export function WishlistClient({ items: initialItems }: WishlistClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function handleRemove(productId: number) {
    setRemovingId(productId);
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    setRemovingId(null);
  }

  async function handleAddToCart(product: WishlistItem["product"], variantId: number | null) {
    if (!product) return;
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, variantId, quantity: 1 }),
    });
    router.push("/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
          <Heart className="h-8 w-8 text-rose-400" />
        </div>
        <p className="text-[#8A9283] text-lg mb-4">Your wishlist is empty</p>
        <Link
          href="/shop"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item) => {
        if (!item.product) return null;
        const variantLabel = [item.variant?.color, item.variant?.size].filter(Boolean).join(" / ");

        return (
          <div
            key={item.id}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#E0D8C8]/50 hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative aspect-square bg-[#E8E2D4] overflow-hidden">
              {item.product.imageUrl ? (
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-[#B8B2A3]" />
                </div>
              )}
              <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-[#4A6B6D] capitalize shadow-sm">
                {item.product.category}
              </span>
              <button
                onClick={() => handleRemove(item.productId)}
                disabled={removingId === item.productId}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-rose-50 transition-all"
                title="Remove from wishlist"
              >
                {removingId === item.productId ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                ) : (
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                )}
              </button>
            </div>

            {/* Info */}
            <div className="p-4 sm:p-5">
              <h3
                className="text-lg font-semibold text-[#2C2C2C] mb-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {item.product.name}
              </h3>

              {variantLabel && (
                <p className="text-sm text-[#8A9283] mb-1">{variantLabel}</p>
              )}

              <p className="text-xl font-bold text-[#4A6B6D] mb-4">
                {formatPrice(item.product.basePrice)}
              </p>

              <button
                onClick={() => handleAddToCart(item.product, item.variantId)}
                className="w-full py-2.5 rounded-full bg-[#4A6B6D] text-white text-sm font-medium hover:bg-[#3A5557] transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
