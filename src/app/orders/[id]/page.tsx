import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, orderItems, orderItems as orderItemsTable, deliveryZones, products, productVariants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { config } from "@/lib/config";
import { OrderStatusBadge, OrderStatusTimeline } from "@/components/OrderStatusBadge";
import { ArrowLeft, Package, MapPin, Receipt, Banknote } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

// Page requires DB queries — render dynamically
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const orderId = parseInt(id, 10);

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (!order) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));

  let zoneName = null;
  if (order.deliveryZoneId) {
    const [zone] = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, order.deliveryZoneId))
      .limit(1);
    zoneName = zone?.zoneName ?? null;
  }

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-[#8A9283] hover:text-[#4A6B6D] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <h1
            className="text-3xl font-bold text-[#2C2C2C]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Order #{order.id}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-4">
            Status
          </h2>
          <OrderStatusTimeline status={order.status} />
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-4">
            Items
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#E0D8C8]/50 last:border-0">
                <div>
                  <p className="font-medium text-[#2C2C2C]">{item.nameSnapshot}</p>
                  <p className="text-sm text-[#8A9283]">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-[#4A6B6D]">
                  {formatPrice(item.priceSnapshot * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E0D8C8] mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8A9283]">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.deliveryFee != null && (
              <div className="flex justify-between">
                <span className="text-[#8A9283]">Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-[#E0D8C8]">
              <span className="text-[#2C2C2C]">Total</span>
              <span className="text-[#4A6B6D]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-4">
            Delivery
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#8A9283]" />
              <span className="text-[#5A5A4A]">
                Method: <strong className="capitalize">{order.deliveryMethod ?? "N/A"}</strong>
              </span>
            </div>
            {zoneName && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#8A9283]" />
                <span className="text-[#5A5A4A]">Zone: <strong>{zoneName}</strong></span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="h-4 w-4 text-[#8A9283] mt-0.5" />
                <div>
                  <span className="text-[#8A9283] text-xs">Address:</span>
                  <p className="text-[#5A5A4A] whitespace-pre-line">{order.deliveryAddress}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-4">
            Payment
          </h2>
          <div className="p-4 rounded-lg bg-[#F2EDE1] mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-5 w-5 text-[#4A6B6D]" />
              <span className="font-medium text-[#2C2C2C]">Bank Transfer</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-[#8A9283]">Bank:</span> {config.bank.name}</p>
              <p><span className="text-[#8A9283]">Name:</span> {config.bank.accountName}</p>
              <div className="flex items-center gap-2">
                <span className="text-[#8A9283]">Account:</span>
                <strong className="text-[#4A6B6D]">{config.bank.accountNumber}</strong>
                <CopyButton text={config.bank.accountNumber} label="Copy" />
              </div>
            </div>
          </div>
          {order.receiptUrl ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Receipt className="h-4 w-4" />
              <span>Receipt uploaded</span>
            </div>
          ) : (
            <p className="text-sm text-amber-600">No receipt uploaded yet. Please complete your payment and upload the receipt.</p>
          )}
        </div>

        <p className="text-xs text-[#B8B2A3] text-center">
          Order placed on {new Date(order.createdAt).toLocaleDateString("en-NG", {
            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
