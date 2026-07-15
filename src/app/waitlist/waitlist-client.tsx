"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Clock, ShoppingBag, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useState } from "react";

interface WaitlistItem {
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

interface WaitlistClientProps {
  items: WaitlistItem[];
}

export function WaitlistClient({ items: initialItems }: WaitlistClientProps) {
  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addingCartId, setAddingCartId] = useState<number | null>(null);

  async function handleRemove(productId: number) {
    setRemovingId(productId);
    await fetch("/api/waitlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    setRemovingId(null);
  }

  async function handleAddToCart(productId: number, variantId: number | null) {
    setAddingCartId(productId);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, quantity: 1 }),
    });
    if (res.ok) {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
    setAddingCartId(null);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-[#8A9283] text-lg mb-2">Your waitlist is empty</p>
        <p className="text-[#A8B0A3] text-sm mb-6">
          Join the waitlist for sold-out items and we&apos;ll notify you when they&apos;re back in stock.
        </p>
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
            <Link href={`/shop/${item.product.id}`} className="block relative aspect-square bg-[#E8E2D4] overflow-hidden">
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
                onClick={(e) => { e.preventDefault(); handleRemove(item.productId); }}
                disabled={removingId === item.productId}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 transition-all"
                title="Remove from waitlist"
              >
                {removingId === item.productId ? (
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
                )}
              </button>
            </Link>

            {/* Info */}
            <div className="p-4 sm:p-5">
              <Link href={`/shop/${item.product.id}`}>
                <h3
                  className="text-lg font-semibold text-[#2C2C2C] mb-1 hover:text-[#4A6B6D] transition-colors"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {item.product.name}
                </h3>
              </Link>

              {variantLabel && (
                <p className="text-sm text-[#8A9283] mb-1">{variantLabel}</p>
              )}

              <p className="text-xl font-bold text-[#4A6B6D] mb-4">
                {formatPrice(item.product.basePrice)}
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Awaiting restock
                </div>
                <button
                  onClick={() => handleAddToCart(item.product!.id, item.variantId)}
                  disabled={addingCartId === item.productId}
                  className="p-2 rounded-lg bg-[#4A6B6D] text-white hover:bg-[#3A5557] transition-all disabled:opacity-50"
                  title="Add to cart"
                >
                  {addingCartId === item.productId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
