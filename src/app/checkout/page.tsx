"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { config } from "@/lib/config";
import { Trash2, Minus, Plus, Truck, Store, Upload, Check, Banknote, Loader2 } from "lucide-react";

interface CartItem {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  product: {
    id: number;
    name: string;
    basePrice: number;
    imageUrl: string | null;
  };
  variant: {
    id: number;
    color: string | null;
    size: string | null;
  } | null;
}

interface DeliveryZone {
  id: number;
  zoneName: string;
  fee: number;
  active: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ orderId: number } | null>(null);

  // Form state
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cartRes, zonesRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/delivery-zones"),
      ]);

      const cartData = await cartRes.json();
      const zonesData = await zonesRes.json();

      setCartItems(cartData.items ?? []);
      setDeliveryZones(zonesData.zones ?? []);
    } catch (err) {
      setError("Failed to load checkout data.");
    } finally {
      setLoading(false);
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId);
  const deliveryFee = deliveryMethod === "delivery" && selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const canPlaceOrder =
    cartItems.length > 0 &&
    agreedToTerms &&
    (deliveryMethod === "pickup" || (deliveryMethod === "delivery" && selectedZoneId && deliveryAddress));

  const handleQuantityChange = async (itemId: number, newQty: number) => {
    if (newQty < 0) return;
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: newQty }),
    });
    if (res.ok) loadData();
  };

  const handleRemoveItem = async (itemId: number) => {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    if (res.ok) loadData();
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;
    setPlacing(true);
    setError(null);

    try {
      // 1. Create the order
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod,
          deliveryZoneId: deliveryMethod === "delivery" ? selectedZoneId : null,
          deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : null,
          agreedToTerms,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error ?? "Failed to place order");
        setPlacing(false);
        return;
      }

      setOrderResult({ orderId: orderData.orderId });

      // 2. Upload receipt if provided
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        formData.append("orderId", String(orderData.orderId));

        await fetch("/api/upload-receipt", {
          method: "POST",
          body: formData,
        });
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ── Order Confirmation Screen ──
  if (orderResult) {
    return (
      <div className="flex-1 bg-[#F2EDE1] py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1
            className="text-3xl font-bold text-[#2C2C2C] mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Order Placed!
          </h1>
          <p className="text-[#8A9283] mb-2">
            Your order <strong className="text-[#4A6B6D]">#{orderResult.orderId}</strong> has been placed successfully.
          </p>
          <p className="text-[#8A9283] mb-8">
            We&apos;ll send you an email once your order is confirmed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/orders/${orderResult.orderId}`}
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all"
            >
              View Order
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-2.5 rounded-full border border-[#4A6B6D] text-[#4A6B6D] font-medium hover:bg-[#4A6B6D] hover:text-white transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE1]">
        <Loader2 className="h-8 w-8 text-[#4A6B6D] animate-spin" />
      </div>
    );
  }

  // ── Empty Cart Guard ──
  if (cartItems.length === 0) {
    return (
      <div className="flex-1 bg-[#F2EDE1] py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1
            className="text-3xl font-bold text-[#2C2C2C] mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your Cart is Empty
          </h1>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1
          className="text-3xl font-bold text-[#2C2C2C] mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Cart Items */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8]">
              <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Cart Items</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-[#E0D8C8]/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2C2C2C] truncate">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-sm text-[#8A9283]">
                          {[item.variant.color, item.variant.size].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      <p className="text-[#4A6B6D] font-medium text-sm mt-0.5">
                        {formatPrice(item.product.basePrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-[#F2EDE1] text-[#5A5A4A] transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-[#F2EDE1] text-[#5A5A4A] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 rounded-full hover:bg-red-50 text-[#8A9283] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8]">
              <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Delivery Method</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    deliveryMethod === "pickup"
                      ? "border-[#4A6B6D] bg-[#4A6B6D]/5"
                      : "border-[#E0D8C8] hover:border-[#4A6B6D]/30"
                  }`}
                >
                  <Store className="h-6 w-6 mx-auto mb-1 text-[#4A6B6D]" />
                  <span className="text-sm font-medium text-[#2C2C2C]">Pickup</span>
                  <p className="text-xs text-[#8A9283]">Free</p>
                </button>
                <button
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    deliveryMethod === "delivery"
                      ? "border-[#4A6B6D] bg-[#4A6B6D]/5"
                      : "border-[#E0D8C8] hover:border-[#4A6B6D]/30"
                  }`}
                >
                  <Truck className="h-6 w-6 mx-auto mb-1 text-[#4A6B6D]" />
                  <span className="text-sm font-medium text-[#2C2C2C]">Delivery</span>
                  <p className="text-xs text-[#8A9283]">Fee applies</p>
                </button>
              </div>

              {deliveryMethod === "delivery" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5A5A4A] mb-1.5">
                      Delivery Zone
                    </label>
                    <select
                      value={selectedZoneId ?? ""}
                      onChange={(e) => setSelectedZoneId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D]"
                    >
                      <option value="">Select a zone</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.zoneName} — {formatPrice(zone.fee)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A5A4A] mb-1.5">
                      Delivery Address
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#2C2C2C] placeholder-[#B8B2A3] focus:outline-none focus:ring-2 focus:ring-[#4A6B6D]/30 focus:border-[#4A6B6D] resize-none"
                      placeholder="Enter your full delivery address"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bank Transfer Details & Receipt Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8]">
              <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Payment</h2>
              <div className="p-4 rounded-lg bg-[#F2EDE1] mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="h-5 w-5 text-[#4A6B6D]" />
                  <span className="font-medium text-[#2C2C2C]">Bank Transfer</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-[#8A9283]">Bank:</span>{" "}
                    <span className="font-medium">{config.bank.name}</span>
                  </p>
                  <p>
                    <span className="text-[#8A9283]">Account Name:</span>{" "}
                    <span className="font-medium">{config.bank.accountName}</span>
                  </p>
                  <p>
                    <span className="text-[#8A9283]">Account Number:</span>{" "}
                    <span className="font-medium text-lg text-[#4A6B6D]">
                      {config.bank.accountNumber}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A5A4A] mb-1.5">
                  Upload Payment Receipt (optional now, required to verify)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E0D8C8] bg-white text-[#5A5A4A] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-[#4A6B6D] file:text-white file:text-sm file:font-medium hover:file:bg-[#3A5557] transition-all"
                  />
                </div>
                {receiptFile && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" /> {receiptFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E0D8C8] text-[#4A6B6D] focus:ring-[#4A6B6D]"
                />
                <span className="text-sm text-[#5A5A4A]">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-[#4A6B6D] underline hover:no-underline">
                    Terms & Refund Policy
                  </Link>
                </span>
              </label>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] sticky top-24">
              <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8A9283]">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A9283]">
                    Delivery {deliveryMethod === "pickup" ? "(Pickup)" : ""}
                  </span>
                  <span className="font-medium">
                    {deliveryMethod === "pickup" ? "Free" : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="border-t border-[#E0D8C8] pt-3 flex justify-between">
                  <span className="font-semibold text-[#2C2C2C]">Total</span>
                  <span className="font-bold text-lg text-[#4A6B6D]">{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder || placing}
                className="w-full mt-6 py-3 rounded-full bg-[#A6822E] text-white font-medium hover:bg-[#8E6E1F] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" /> Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
