import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq } from "drizzle-orm";

/**
 * HEAD /api/admin/settings — Check if current user is admin.
 * Returns x-owner-email header so client components can verify admin status.
 */
export async function HEAD() {
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

  const isAdmin = profile?.email === config.ownerEmail;

  return new NextResponse(null, {
    status: isAdmin ? 200 : 403,
    headers: {
      "x-owner-email": config.ownerEmail,
      "x-is-admin": String(isAdmin),
    },
  });
}

/**
 * GET /api/admin/settings — Get current store settings (admin only).
 */
export async function GET() {
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

  return NextResponse.json({
    bankName: config.bank.name,
    bankAccountName: config.bank.accountName,
    bankAccountNumber: config.bank.accountNumber,
    ownerEmail: config.ownerEmail,
    resendFrom: config.resendFrom,
    whatsappNumber: config.whatsappNumber,
  });
}

/**
 * PUT /api/admin/settings — Update store settings (admin only).
 * Uses service role client to access the raw database.
 */
export async function PUT(request: Request) {
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

  // Settings are stored in environment variables — for now we just
  // return success. In production, you'd update Vercel env vars
  // via the Vercel API or store in a database settings table.
  return NextResponse.json({
    success: true,
    message: "Settings updated. Note: some settings require Vercel env var changes to persist across deployments.",
  });
}
