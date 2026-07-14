import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Package, ChevronRight, Store, Truck } from "lucide-react";

// Page requires DB queries — render dynamically
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/orders");
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="flex-1 bg-[#F2EDE1]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm text-[#8A9283] hover:text-[#4A6B6D] mb-6 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Shop
        </Link>

        <h1
          className="text-3xl font-bold text-[#2C2C2C] mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          My Orders
        </h1>

        {userOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-[#E0D8C8]">
            <Package className="h-12 w-12 mx-auto mb-4 text-[#B8B2A3]" />
            <p className="text-[#8A9283] text-lg mb-4">No orders yet</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white font-medium hover:bg-[#3A5557] transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-[#E0D8C8] group hover:border-[#4A6B6D]/30"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {/* Delivery method icon */}
                      {order.deliveryMethod === "delivery" ? (
                        <Truck className="h-4 w-4 text-[#8A9283]" />
                      ) : (
                        <Store className="h-4 w-4 text-[#8A9283]" />
                      )}
                      <span className="text-lg font-semibold text-[#2C2C2C]">
                        #{order.id}
                      </span>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="text-sm text-[#8A9283]">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="font-medium text-[#4A6B6D]">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#B8B2A3] group-hover:text-[#4A6B6D] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
