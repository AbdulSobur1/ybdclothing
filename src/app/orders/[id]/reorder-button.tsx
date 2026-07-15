"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Check } from "lucide-react";

interface ReorderButtonProps {
  orderId: number;
}

export function ReorderButton({ orderId }: ReorderButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleReorder = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/cart/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Items added to cart!");
        window.dispatchEvent(new CustomEvent("cart-updated"));
        setTimeout(() => {
          router.push("/checkout");
        }, 1200);
      } else {
        console.error("Reorder error:", data.error);
        setStatus("error");
        setMessage("Failed to reorder. Please try again.");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div>
      <button
        onClick={handleReorder}
        disabled={status === "loading" || status === "success"}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white text-sm font-medium hover:bg-[#3A5557] transition-all disabled:opacity-50 shadow-sm hover:shadow-md active:scale-[0.97]"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "success" ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {status === "loading"
          ? "Adding to cart..."
          : status === "success"
            ? "Added! Redirecting..."
            : "Buy Again"}
      </button>
      {message && status === "error" && (
        <p className="text-xs text-red-500 mt-2">{message}</p>
      )}
    </div>
  );
}
