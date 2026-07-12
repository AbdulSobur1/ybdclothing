import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, orderItems, deliveryZones, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { config } from "@/lib/config";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderStatusUpdateForm } from "./status-form";
import { ArrowLeft } from "lucide-react";

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

// Page requires DB queries — render dynamically
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Simple admin check — the owner email in config is considered admin.
  // In production, use a proper admin role or Supabase custom claims.
  let isAdmin = false;
  let adminEmail = "";
  if (user) {
    const profileRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    adminEmail = profileRows[0]?.email ?? "";
    isAdmin = adminEmail === config.ownerEmail;
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F2EDE1] py-20">
        <div className="text-center">
          <p className="text-[#8A9283] text-lg">Unauthorized</p>
          <p className="text-[#B8B2A3] text-sm mt-1">Only the store owner can access this page.</p>
        </div>
      </div>
    );
  }

  const orderId = parseInt(id, 10);

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  let zoneName = null;
  if (order.deliveryZoneId) {
    const [zone] = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, order.deliveryZoneId))
      .limit(1);
    zoneName = zone?.zoneName ?? null;
  }

  // Fetch customer profile via Drizzle
  const [customerProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, order.userId))
    .limit(1);

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#8A9283] hover:text-[#4A6B6D] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl font-bold text-[#2C2C2C]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Order #{order.id}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-3">
            Customer
          </h2>
          <p className="text-[#2C2C2C] font-medium">{customerProfile?.fullName ?? "N/A"}</p>
          <p className="text-[#8A9283] text-sm">{customerProfile?.email ?? "N/A"}</p>
          <p className="text-[#8A9283] text-sm">{customerProfile?.phone ?? "No phone"}</p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-3">Items</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[#5A5A4A]">{item.nameSnapshot} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(item.priceSnapshot * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E0D8C8] mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-[#4A6B6D]">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-3">Delivery</h2>
          <p className="text-sm text-[#5A5A4A] capitalize">Method: {order.deliveryMethod ?? "N/A"}</p>
          {zoneName && <p className="text-sm text-[#5A5A4A]">Zone: {zoneName}</p>}
          {order.deliveryAddress && (
            <p className="text-sm text-[#5A5A4A] mt-1 whitespace-pre-line">Address: {order.deliveryAddress}</p>
          )}
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8] mb-6">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-3">Receipt</h2>
          {order.receiptUrl ? (
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${order.receiptUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A6B6D] underline text-sm hover:no-underline"
            >
              View Receipt
            </a>
          ) : (
            <p className="text-sm text-amber-600">No receipt uploaded yet.</p>
          )}
        </div>

        {/* Update Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0D8C8]">
          <h2 className="text-sm font-semibold text-[#5A5A4A] uppercase tracking-wider mb-4">
            Update Status
          </h2>
          <OrderStatusUpdateForm
            orderId={order.id}
            currentStatus={order.status}
            customerEmail={customerProfile?.email ?? ""}
            customerName={customerProfile?.fullName ?? "Customer"}
          />
        </div>
      </div>
    </div>
  );
}
