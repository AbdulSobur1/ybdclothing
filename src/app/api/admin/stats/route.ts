import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, profiles, deliveryZones } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq, sql, and, desc } from "drizzle-orm";

/**
 * GET /api/admin/stats — Returns dashboard overview stats (admin only).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.email !== config.ownerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Total orders
  const [totalOrdersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);

  // Orders by status
  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .groupBy(orders.status);

  // Total revenue (sum of all completed/confirmed order totals)
  const [revenueResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(
      sql`${orders.status} IN ('confirmed', 'completed', 'shipped')`,
    );

  // Total products
  const [totalProductsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.active, true));

  // Total customers (unique users who placed orders)
  const [customersResult] = await db
    .select({ count: sql<number>`count(distinct ${orders.userId})` })
    .from(orders);

  // Total profiles (registered users)
  const [profilesResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles);

  // Recent orders (last 10)
  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  // Recent products (last 6)
  const recentProducts = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.createdAt))
    .limit(6);

  // Orders by month (last 6 months for the chart)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const ordersByMonth = await db
    .select({
      month: sql<string>`to_char(${orders.createdAt}, 'Mon')`,
      year: sql<string>`to_char(${orders.createdAt}, 'YYYY')`,
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${sixMonthsAgo}`)
    .groupBy(sql`to_char(${orders.createdAt}, 'Mon')`, sql`to_char(${orders.createdAt}, 'YYYY')`)
    .orderBy(sql`min(${orders.createdAt})`);

  // Recent orders with customer names
  const recentOrdersWithCustomers = await Promise.all(
    recentOrders.map(async (order) => {
      const [customer] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, order.userId))
        .limit(1);
      return { ...order, customer: customer ?? null };
    }),
  );

  return NextResponse.json({
    totalOrders: Number(totalOrdersResult?.count ?? 0),
    ordersByStatus: ordersByStatus.reduce((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {} as Record<string, number>),
    totalRevenue: Number(revenueResult?.total ?? 0),
    totalProducts: Number(totalProductsResult?.count ?? 0),
    totalCustomers: Number(customersResult?.count ?? 0),
    totalProfiles: Number(profilesResult?.count ?? 0),
    recentOrders: recentOrdersWithCustomers,
    recentProducts,
    ordersByMonth: ordersByMonth.map((row) => ({
      month: `${row.month} ${row.year}`,
      orders: Number(row.count),
      revenue: Number(row.revenue),
    })),
  });
}
