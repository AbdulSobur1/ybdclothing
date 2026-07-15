import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, products, profiles, productVariants } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";

/**
 * GET /api/admin/stats — Returns dashboard overview stats (admin only).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!await checkAdmin(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .groupBy(orders.status);

  const [revenueResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(sql`${orders.status}::text IN ('confirmed', 'completed', 'shipped')`);

  const [totalProductsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.active, true));

  const [customersResult] = await db
    .select({ count: sql<number>`count(distinct ${orders.userId})` })
    .from(orders);

  const [profilesResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const recentProducts = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.createdAt))
    .limit(6);

  // Low-stock variants (stock 1-5) and out-of-stock variants
  const lowStockItems = await db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      color: productVariants.color,
      size: productVariants.size,
      stockQuantity: productVariants.stockQuantity,
      sku: productVariants.sku,
    })
    .from(productVariants)
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(sql`${productVariants.stockQuantity} <= 5`)
    .orderBy(productVariants.stockQuantity);

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
    .where(sql`${orders.createdAt}::date >= ${sixMonthsAgo.toISOString().split('T')[0]}::date`)
    .groupBy(sql`to_char(${orders.createdAt}, 'Mon')`, sql`to_char(${orders.createdAt}, 'YYYY')`)
    .orderBy(sql`min(${orders.createdAt})`);

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

  const lowStockCount = lowStockItems.filter((i) => i.stockQuantity > 0).length;
  const outOfStockCount = lowStockItems.filter((i) => i.stockQuantity <= 0).length;

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
    lowStockItems,
    lowStockCount,
    outOfStockCount,
  });
  } catch (error) {
    console.error("Stats API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
