import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";
import { withErrorHandling, validatePositiveInteger, requireContentType } from "@/lib/api-helpers";

/**
 * GET /api/admin/testimonials — List all testimonials.
 */
export const GET = withErrorHandling(async function () {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const all = await db
    .select()
    .from(testimonials)
    .orderBy(desc(testimonials.createdAt));

  return NextResponse.json({ testimonials: all });
});

/**
 * POST /api/admin/testimonials — Create a new testimonial.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { quote, author, role, rating } = body;

  if (!quote || !author) {
    return NextResponse.json({ error: "Quote and author are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(testimonials)
    .values({
      quote,
      author,
      role: role ?? null,
      rating: rating ?? 5,
      active: true,
    })
    .returning();

  return NextResponse.json({ testimonial: created }, { status: 201 });
});

/**
 * PUT /api/admin/testimonials — Update a testimonial.
 */
export const PUT = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, quote, author, role, rating, active } = body;

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  await db
    .update(testimonials)
    .set({
      ...(quote !== undefined && { quote }),
      ...(author !== undefined && { author }),
      ...(role !== undefined && { role }),
      ...(rating !== undefined && { rating }),
      ...(active !== undefined && { active }),
    })
    .where(eq(testimonials.id, id));

  return NextResponse.json({ success: true });
});

/**
 * DELETE /api/admin/testimonials — Delete a testimonial.
 */
export const DELETE = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id } = body;
  const idError = validatePositiveInteger(id, "Testimonial ID");
  if (idError) return NextResponse.json({ error: idError }, { status: 400 });

  await db.delete(testimonials).where(eq(testimonials.id, id));
  return NextResponse.json({ success: true });
});
