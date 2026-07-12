import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliveryZones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/delivery-zones — Fetch all active delivery zones.
 */
export async function GET() {
  const zones = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.active, true));

  return NextResponse.json({ zones });
}
