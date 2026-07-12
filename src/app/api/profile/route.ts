import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/profile — Create a profile record after signup.
 * Uses the authenticated user's session (anon key is sufficient
 * when RLS allows INSERT with auth.uid() = id).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { fullName, email, phone, defaultAddress } = body;

  if (!fullName || !email) {
    return NextResponse.json({ error: "Full name and email are required" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    email,
    phone: phone || null,
    default_address: defaultAddress || null,
  });

  if (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
