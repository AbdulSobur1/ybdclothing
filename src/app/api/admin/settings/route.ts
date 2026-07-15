import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq } from "drizzle-orm";
import { checkAdmin } from "@/lib/admin";

const SETTING_DEFAULTS: Record<string, string> = {
  bank_name: config.bank.name,
  bank_account_name: config.bank.accountName,
  bank_account_number: config.bank.accountNumber,
  owner_email: config.ownerEmail,
  resend_from: config.resendFrom,
  whatsapp_number: config.whatsappNumber,
  phone_number: config.phone,
  instagram: "https://www.instagram.com/Ybd___clothing_/",
  tiktok: "https://www.tiktok.com/@ybd_clothing_",
};

async function getSetting(key: string): Promise<string> {
  const [row] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.key, key))
    .limit(1);
  return row?.value ?? SETTING_DEFAULTS[key] ?? "";
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(storeSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: storeSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * HEAD /api/admin/settings — Check if current user is admin.
 */
export async function HEAD() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isAdmin = await checkAdmin(user.id);

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

  if (!await checkAdmin(user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [bankName, bankAccountName, bankAccountNumber, ownerEmail, resendFrom, whatsappNumber, phoneNumber, instagram, tiktok] =
    await Promise.all([
      getSetting("bank_name"),
      getSetting("bank_account_name"),
      getSetting("bank_account_number"),
      getSetting("owner_email"),
      getSetting("resend_from"),
      getSetting("whatsapp_number"),
      getSetting("phone_number"),
      getSetting("instagram"),
      getSetting("tiktok"),
    ]);

  return NextResponse.json({
    bankName,
    bankAccountName,
    bankAccountNumber,
    ownerEmail,
    resendFrom,
    whatsappNumber,
    phoneNumber,
    instagram,
    tiktok,
  });
}

/**
 * PUT /api/admin/settings — Update store settings (admin only).
 */
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!await checkAdmin(user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { bankName, bankAccountName, bankAccountNumber, ownerEmail, resendFrom, whatsappNumber, phoneNumber, instagram, tiktok } = body;

  try {
    const updates: Promise<void>[] = [];
    if (bankName !== undefined) updates.push(setSetting("bank_name", bankName));
    if (bankAccountName !== undefined) updates.push(setSetting("bank_account_name", bankAccountName));
    if (bankAccountNumber !== undefined) updates.push(setSetting("bank_account_number", bankAccountNumber));
    if (ownerEmail !== undefined) updates.push(setSetting("owner_email", ownerEmail));
    if (resendFrom !== undefined) updates.push(setSetting("resend_from", resendFrom));
    if (whatsappNumber !== undefined) updates.push(setSetting("whatsapp_number", whatsappNumber));
    if (phoneNumber !== undefined) updates.push(setSetting("phone_number", phoneNumber));
    if (instagram !== undefined) updates.push(setSetting("instagram", instagram));
    if (tiktok !== undefined) updates.push(setSetting("tiktok", tiktok));

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully to the database.",
    });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
