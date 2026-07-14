import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, orders } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";

/**
 * GET /api/admin/customers — List all customers with their order stats.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const allProfiles = await db
    .select()
    .from(profiles)
    .orderBy(desc(profiles.createdAt));

  const customersWithStats = await Promise.all(
    allProfiles.map(async (profile) => {
      const [orderResult] = await db
        .select({
          orderCount: sql<number>`count(*)`,
          totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
        })
        .from(orders)
        .where(eq(orders.userId, profile.id));

      return {
        ...profile,
        orderCount: Number(orderResult?.orderCount ?? 0),
        totalSpent: Number(orderResult?.totalSpent ?? 0),
      };
    }),
  );

  return NextResponse.json({ customers: customersWithStats });
}
