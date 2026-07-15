"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  ShoppingBag,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
  BarChart3,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { SkeletonStatsGrid, SkeletonTable, SkeletonLine } from "@/components/Skeleton";

interface DashboardData {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  totalProfiles: number;
  recentOrders: Array<{
    id: number;
    status: string;
    total: number;
    createdAt: string;
    customer: { full_name: string; email: string } | null;
  }>;
  recentProducts: Array<{
    id: number;
    name: string;
    category: string;
    basePrice: number;
    imageUrl: string | null;
  }>;
  ordersByMonth: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    variantId: number;
    productId: number;
    productName: string;
    color: string | null;
    size: string | null;
    stockQuantity: number;
    sku: string | null;
  }>;
  lowStockCount: number;
  outOfStockCount: number;
}

const statusColors: Record<string, string> = {
  pending_payment: "bg-amber-500",
  pending_verification: "bg-blue-500",
  confirmed: "bg-emerald-500",
  rejected: "bg-red-500",
  shipped: "bg-purple-500",
  completed: "bg-green-500",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<"bar" | "line">("bar");
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setRefreshing(true);
      setErrorMessage(null);
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setData(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error || `Server error (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
      setErrorMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SkeletonLine className="h-7 w-40 bg-white/10" />
          <SkeletonLine className="h-9 w-24 bg-white/10" />
        </div>
        <SkeletonStatsGrid />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#16213e] rounded-xl p-5 border border-white/5">
            <SkeletonLine className="h-4 w-40 bg-white/10 mb-4" />
            <SkeletonLine className="h-32 bg-white/10 rounded" />
          </div>
          <div className="bg-[#16213e] rounded-xl p-5 border border-white/5">
            <SkeletonLine className="h-4 w-32 bg-white/10 mb-4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonLine key={i} className="h-9 w-full bg-white/10 mb-2 rounded" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable rows={4} />
          <div className="bg-[#16213e] rounded-xl border border-white/5">
            <div className="p-5 border-b border-white/5">
              <SkeletonLine className="h-4 w-24 bg-white/10" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <SkeletonLine className="h-10 w-10 rounded-lg bg-white/10" />
                <div className="flex-1">
                  <SkeletonLine className="h-4 w-32 bg-white/10 mb-1" />
                  <SkeletonLine className="h-3 w-16 bg-white/10" />
                </div>
                <SkeletonLine className="h-4 w-16 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-2">Failed to load dashboard data.</p>
        {errorMessage && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 font-mono max-w-md break-all">{errorMessage}</p>
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A6822E] text-white text-sm font-medium hover:bg-[#8E6E1F] transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const chartHeight = 120;
  const maxRevenue = Math.max(...data.ordersByMonth.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your store performance</p>
        </div>
        <button
          onClick={loadStats}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#16213e] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#A6822E]/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-[#A6822E]" />
            </div>
            {data.totalOrders > 0 && <TrendingUp className="h-4 w-4 text-emerald-400" />}
          </div>
          <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">Total Orders</p>
        </div>

        <div className="bg-[#16213e] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatPrice(data.totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">Total Revenue</p>
        </div>

        <div className="bg-[#16213e] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalProducts}</p>
          <p className="text-xs text-gray-400 mt-1">Active Products</p>
        </div>

        <div className="bg-[#16213e] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalProfiles}</p>
          <p className="text-xs text-gray-400 mt-1">Total Customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-[#16213e] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue (Last 6 Months)</h2>
            <button
              onClick={() => setChartView(chartView === "bar" ? "line" : "bar")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-all"
              title={`Switch to ${chartView === "bar" ? "line" : "bar"} chart`}
            >
              {chartView === "bar" ? <TrendingDown className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
              {chartView === "bar" ? "Line" : "Bar"}
            </button>
          </div>
          {data.ordersByMonth.length > 0 ? (
            <div className="relative" style={{ height: chartHeight }}>
              {chartView === "bar" ? (
                <div className="flex items-end justify-between gap-2 h-full">
                  {data.ordersByMonth.map((item, i) => {
                    const height = (item.revenue / maxRevenue) * chartHeight;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] text-gray-500">
                          {formatPrice(item.revenue)}
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-[#A6822E] to-[#C4A85D] rounded-t-sm transition-all duration-500 hover:opacity-80"
                          style={{ height: Math.max(height, 4) }}
                        />
                        <span className="text-[10px] text-gray-500">{item.month.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative h-full">
                  <svg className="w-full h-full" viewBox={`0 0 ${data.ordersByMonth.length * 60} ${chartHeight}`} preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="url(#goldGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={data.ordersByMonth
                        .map((item, i) => {
                          const x = i * 60 + 30;
                          const y = chartHeight - (item.revenue / maxRevenue) * chartHeight;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#A6822E" />
                        <stop offset="100%" stopColor="#C4A85D" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex justify-between mt-2">
                    {data.ordersByMonth.map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-500">{formatPrice(item.revenue)}</span>
                        <span className="text-[10px] text-gray-500">{item.month.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm py-8 text-center">No revenue data yet</p>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-[#16213e] rounded-xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).length > 0 ? (
              Object.entries(data.ordersByStatus).map(([status, count]) => {
                const total = data.totalOrders || 1;
                const percentage = (count / total) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400 capitalize">
                        {status.replace(/_/g, " ")}
                      </span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusColors[status] ?? "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders and products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-[#16213e] rounded-xl border border-white/5">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-[#A6822E] hover:text-[#C4A85D] transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {data.recentOrders.slice(0, 6).map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">#{order.id}</span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {order.customer?.full_name ?? "Unknown"}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-white">{formatPrice(order.total)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
              </Link>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No orders yet</p>
            )}
          </div>
        </div>

        {/* Recent products */}
        <div className="bg-[#16213e] rounded-xl border border-white/5">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Products</h2>
            <Link
              href="/admin/products"
              className="text-xs text-[#A6822E] hover:text-[#C4A85D] transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {data.recentProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-white ml-4">{formatPrice(product.basePrice)}</p>
              </div>
            ))}
            {data.recentProducts.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No products yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock alerts */}
      {(data.lowStockCount > 0 || data.outOfStockCount > 0) && (
        <div className="bg-[#16213e] rounded-xl border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Stock Alerts</h2>
            {data.lowStockCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                {data.lowStockCount} low
              </span>
            )}
            {data.outOfStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-medium">
                {data.outOfStockCount} out of stock
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lowStockItems.filter((i) => i.stockQuantity > 0).slice(0, 6).map((item) => (
              <Link
                key={item.variantId}
                href={`/admin/products/${item.productId}/edit`}
                className="flex items-center gap-3 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    {[item.color, item.size].filter(Boolean).join(" / ") || "Default"} — {item.stockQuantity} left
                  </p>
                </div>
              </Link>
            ))}
            {data.lowStockItems.filter((i) => i.stockQuantity <= 0).slice(0, 3).map((item) => (
              <Link
                key={item.variantId}
                href={`/admin/products/${item.productId}/edit`}
                className="flex items-center gap-3 bg-red-500/10 rounded-lg p-3 hover:bg-red-500/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{item.productName}</p>
                  <p className="text-xs text-red-400">
                    {[item.color, item.size].filter(Boolean).join(" / ") || "Default"} — Out of stock
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
