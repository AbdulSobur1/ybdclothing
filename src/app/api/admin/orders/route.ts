import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, orderItems, profiles, deliveryZones } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/admin/orders — List all orders with optional filters.
 * Query params: status, search (by order ID or customer name), page, limit, export=csv
 */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;
  const isExport = searchParams.get("export") === "csv";

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [];
  if (statusFilter && statusFilter !== "all") {
    // Cast to any because the enum type from drizzle is strict
    conditions.push(eq(orders.status, statusFilter as any));
  }

  let allOrders;
  let totalCount: number;

  if (search) {
    // Search by order ID or customer name via subquery
    const searchNum = parseInt(search, 10);
    const isId = !isNaN(searchNum);

    const profileSubquery = db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        sql`${profiles.fullName} ILIKE ${`%${search}%`}`,
      );

    const searchConditions: (ReturnType<typeof eq> | import("drizzle-orm").SQL)[] = [];
    if (isId) {
      searchConditions.push(eq(orders.id, searchNum));
    }
    searchConditions.push(sql`${orders.userId} IN (${profileSubquery})`);

    const combinedWhere = and(...conditions, sql`(${searchConditions.join(" OR ")})`);

    allOrders = await db
      .select()
      .from(orders)
      .where(combinedWhere)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(combinedWhere);
    totalCount = Number(countResult?.count ?? 0);
  } else {
    const combinedWhere = conditions.length > 0 ? and(...conditions) : undefined;

    allOrders = await db
      .select()
      .from(orders)
      .where(combinedWhere)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(combinedWhere);
    totalCount = Number(countResult?.count ?? 0);
  }

  // Attach customer info and delivery zone name
  const ordersWithDetails = await Promise.all(
    allOrders.map(async (order) => {
      const [customer] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, order.userId))
        .limit(1);

      let zoneName = null;
      if (order.deliveryZoneId) {
        const [zone] = await db
          .select()
          .from(deliveryZones)
          .where(eq(deliveryZones.id, order.deliveryZoneId))
          .limit(1);
        zoneName = zone?.zoneName ?? null;
      }

      const [itemsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        customer: customer ?? null,
        zoneName,
        itemCount: Number(itemsResult?.count ?? 0),
      };
    }),
  );

  if (isExport) {
    // CSV export — return a downloadable CSV file with ALL matched orders
    const csvRows = [
      ["Order ID", "Customer", "Email", "Status", "Items", "Total (₦)", "Delivery", "Zone", "Date"].join(","),
      ...ordersWithDetails.map((o) =>
        [
          o.id,
          `"${              o.customer?.fullName ?? "Unknown"}"`,
          `"${o.customer?.email ?? ""}"`,
          o.status,
          o.itemCount,
          o.total / 100, // price in Naira
          o.deliveryMethod ?? "N/A",
          `"${o.zoneName ?? ""}"`,
          new Date(o.createdAt).toISOString().split("T")[0],
        ].join(","),
      ),
    ].join("\n");

    return new NextResponse(csvRows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    orders: ordersWithDetails,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
