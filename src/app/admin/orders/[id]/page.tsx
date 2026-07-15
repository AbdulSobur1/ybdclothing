import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, orderItems, orderNotes, deliveryZones, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { config } from "@/lib/config";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderStatusUpdateForm } from "./status-form";
import { NotesSection } from "./notes-section";
import { ArrowLeft, Package, User, MapPin, ExternalLink } from "lucide-react";

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
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Unauthorized</p>
        <p className="text-gray-500 text-sm mt-1">Only the store owner can access this page.</p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-[#A6822E] hover:text-[#C4A85D] mt-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
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

  const rawNotes = await db
    .select()
    .from(orderNotes)
    .where(eq(orderNotes.orderId, orderId))
    .orderBy(desc(orderNotes.createdAt));

  // Serialize dates for client component
  const notes = rawNotes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

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
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Order #{order.id}</h1>
        <OrderStatusBadge status={order.status} size="md" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#A6822E]" /> Items
            </h2>
            <div className="divide-y divide-white/5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-white">{item.nameSnapshot}</p>
                    <p className="text-xs text-gray-400">× {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 mt-3 pt-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">Subtotal</span>
              <span className="text-sm font-medium text-white">{formatPrice(order.subtotal)}</span>
            </div>
            {order.deliveryFee ? (
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-400">Delivery fee</span>
                <span className="text-sm font-medium text-white">{formatPrice(order.deliveryFee)}</span>
              </div>
            ) : null}
            <div className="border-t border-white/5 mt-3 pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-white">Total</span>
              <span className="text-lg font-bold text-[#A6822E]">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#A6822E]" /> Delivery
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Method</span>
                <span className="text-white capitalize">{order.deliveryMethod ?? "N/A"}</span>
              </div>
              {zoneName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Zone</span>
                  <span className="text-white">{zoneName}</span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-gray-400 block mb-1">Address</span>
                  <span className="text-white whitespace-pre-line text-xs">{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-[#A6822E]" /> Customer
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-white font-medium">{customerProfile?.fullName ?? "N/A"}</p>
              <p className="text-gray-400 text-xs">{customerProfile?.email ?? "N/A"}</p>
              {customerProfile?.phone && (
                <p className="text-gray-400 text-xs">{customerProfile.phone}</p>
              )}
            </div>
          </div>

          {/* Receipt */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Receipt</h2>
            {order.receiptUrl ? (
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${order.receiptUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#A6822E] hover:text-[#C4A85D] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Receipt
              </a>
            ) : (
              <p className="text-sm text-amber-400/80">No receipt uploaded yet.</p>
            )}
          </div>

          {/* Order Notes */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <NotesSection orderId={order.id} initialNotes={notes} />
          </div>

          {/* Order info */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Order Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span className="text-white">
                  {new Date(order.createdAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Items</span>
                <span className="text-white">{items.length}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Update Status</h2>
            <OrderStatusUpdateForm
              orderId={order.id}
              currentStatus={order.status}
              customerEmail={customerProfile?.email ?? ""}
              customerName={customerProfile?.fullName ?? "Customer"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
