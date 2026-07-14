import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { sendOrderStatusUpdate } from "@/lib/email";
import { eq } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";

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

  if (!await checkAdmin(user.id)) {
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

  await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

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
