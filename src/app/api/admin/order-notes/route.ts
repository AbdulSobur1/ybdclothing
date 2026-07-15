import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orderNotes, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";

/**
 * GET /api/admin/order-notes?orderId=N — List notes for an order.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const orderId = parseInt(searchParams.get("orderId") ?? "", 10);
  if (!orderId) return NextResponse.json({ error: "Order ID is required" }, { status: 400 });

  const notes = await db
    .select()
    .from(orderNotes)
    .where(eq(orderNotes.orderId, orderId))
    .orderBy(desc(orderNotes.createdAt));

  return NextResponse.json({ notes });
}

/**
 * POST /api/admin/order-notes — Create a note on an order.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { orderId, note } = body;

  if (!orderId || !note) {
    return NextResponse.json({ error: "Order ID and note are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(orderNotes)
    .values({
      orderId,
      note,
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ note: created }, { status: 201 });
}
