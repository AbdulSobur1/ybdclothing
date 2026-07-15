import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { deliveryZones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";
import { withErrorHandling, validatePositiveInteger, requireContentType } from "@/lib/api-helpers";

/**
 * GET /api/admin/delivery-zones — List all delivery zones.
 */
export const GET = withErrorHandling(async function () {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const zones = await db
    .select()
    .from(deliveryZones)
    .orderBy(deliveryZones.zoneName);

  return NextResponse.json({ zones });
});

/**
 * POST /api/admin/delivery-zones — Create a new delivery zone.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { zoneName, fee } = body;

  if (!zoneName || fee === undefined) {
    return NextResponse.json({ error: "Zone name and fee are required" }, { status: 400 });
  }

  const [zone] = await db
    .insert(deliveryZones)
    .values({ zoneName, fee: Math.round(fee), active: true })
    .returning();

  return NextResponse.json({ zone }, { status: 201 });
});

/**
 * PUT /api/admin/delivery-zones — Update a delivery zone.
 */
export const PUT = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!await checkAdmin(user.id)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { id, zoneName, fee, active } = body;

  const idError = validatePositiveInteger(id, "Zone ID");
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  await db
    .update(deliveryZones)
    .set({
      ...(zoneName !== undefined && { zoneName }),
      ...(fee !== undefined && { fee: Math.round(fee) }),
      ...(active !== undefined && { active }),
    })
    .where(eq(deliveryZones.id, id));

  return NextResponse.json({ success: true });
});
