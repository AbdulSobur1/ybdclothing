"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Search, ShoppingBag, Loader2, ChevronRight, Download } from "lucide-react";
import { SkeletonLine, SkeletonTable } from "@/components/Skeleton";

interface Order {
  id: number;
  status: string;
  total: number;
  subtotal: number;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  customer: { full_name: string; email: string } | null;
  zoneName: string | null;
  itemCount: number;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "pending_verification", label: "Pending Verification" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadOrders();
  }

  return (
    <div className="space-y-6">          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white">Orders</h1>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                {!loading && `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
              </div>
              {!loading && orders.length > 0 && (
                <a
                  href={`/api/admin/orders?${new URLSearchParams({ status: statusFilter, search, export: "csv" })}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-all"
                  download
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </a>
              )}
            </div>
          </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? "bg-[#A6822E] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or name..."
              className="w-48 pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#A6822E] transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#A6822E] text-white text-xs font-medium hover:bg-[#8E6E1F] transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLine key={i} className="h-8 w-24 rounded-lg bg-white/10" />
            ))}
          </div>
          <SkeletonTable rows={6} />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No orders found</p>
        </div>
      ) : (
        <>
          <div className="bg-[#16213e] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-medium text-white">#{order.id}</span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-white">{order.customer?.full_name ?? "N/A"}</p>
                        <p className="text-xs text-gray-400">{order.customer?.email ?? ""}</p>
                      </td>
                      <td className="p-4">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="p-4 text-sm text-gray-400">{order.itemCount}</td>
                      <td className="p-4 text-sm font-medium text-white">{formatPrice(order.total)}</td>
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-NG")}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-sm text-[#A6822E] hover:text-[#C4A85D] transition-colors"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    page === p
                      ? "bg-[#A6822E] text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
