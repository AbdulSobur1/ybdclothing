import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders, profiles } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { sendOrderStatusUpdate } from "@/lib/email";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/update-order-status
 *
 * Security: only the store owner (identified by email) can update order status.
 * The status change is done server-side — the client never directly mutates status.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Admin check via Drizzle (avoids Supabase client type issues)
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.email !== config.ownerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { orderId, newStatus, customerEmail, customerName } = body;

  if (!orderId || !newStatus) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validStatuses = [
    "pending_payment",
    "pending_verification",
    "confirmed",
    "rejected",
    "shipped",
    "completed",
  ];

  if (!validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Update order status
  await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Send email notification to customer for all status changes
  if (customerEmail) {
    sendOrderStatusUpdate({
      orderId,
      customerEmail,
      customerName: customerName ?? "Customer",
      newStatus,
    });
  }

  return NextResponse.json({ success: true });
}
