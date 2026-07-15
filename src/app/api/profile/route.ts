import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withErrorHandling, requireContentType } from "@/lib/api-helpers";

/**
 * POST /api/profile — Create a profile record after signup.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const contentTypeError = requireContentType(request);
  if (contentTypeError) return contentTypeError;
  const body = await request.json();
  const { fullName, email, phone, defaultAddress, userId } = body;

  if (!fullName || !email) {
    return NextResponse.json({ error: "Full name and email are required" }, { status: 400 });
  }

  // Mode 1: Try authenticated session first
  if (!userId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: fullName,
        email,
        phone: phone || null,
        default_address: defaultAddress || null,
      });

      if (error) {
        console.error("Profile creation error (anon):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  }

  // Mode 2: Service-role fallback (used during signup when no session exists yet)
  if (userId) {
    const supabaseAdmin = createServiceClient();
    const { error } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: fullName,
      email,
      phone: phone || null,
      default_address: defaultAddress || null,
    });

    if (error) {
      console.error("Profile creation error (admin):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Not authenticated and no userId provided" }, { status: 401 });
});
