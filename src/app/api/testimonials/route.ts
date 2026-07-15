import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/testimonials — Fetch active testimonials (public, no auth required).
 */
export async function GET() {
  const all = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.active, true))
    .orderBy(desc(testimonials.createdAt));

  return NextResponse.json({ testimonials: all });
}
