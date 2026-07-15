import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orderNotes, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";
import { withErrorHandling, validatePositiveInteger, requireContentType } from "@/lib/api-helpers";

/**
 * GET /api/admin/order-notes?orderId=N — List notes for an order.
 */
export const GET = withErrorHandling(async function (request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const orderId = parseInt(searchParams.get("orderId") ?? "", 10);
  const idError = validatePositiveInteger(orderId, "Order ID");
  if (idError) return NextResponse.json({ error: idError }, { status: 400 });

  const notes = await db
    .select()
    .from(orderNotes)
    .where(eq(orderNotes.orderId, orderId))
    .orderBy(desc(orderNotes.createdAt));

  return NextResponse.json({ notes });
});

/**
 * POST /api/admin/order-notes — Create a note on an order.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { orderId, note } = body;

  if (!orderId || !note || note.trim().length === 0) {
    return NextResponse.json({ error: "Order ID and note are required" }, { status: 400 });
  }

  const idError = validatePositiveInteger(orderId, "Order ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
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
});
