import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { checkAdmin } from "@/lib/admin";

/**
 * POST /api/admin/products/upload — Upload a product image to Supabase Storage.
 *
 * Returns a public URL that can be saved to the product's imageUrl field.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!await checkAdmin(user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!config.storage.allowedFileTypes.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Invalid file type. Allowed: ${config.storage.allowedFileTypes.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (file.size > config.storage.maxFileSize) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${config.storage.maxFileSize / 1024 / 1024} MB` },
      { status: 400 },
    );
  }

  const supabaseAdmin = createServiceClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(config.storage.productImagesBucket)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Product image upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(config.storage.productImagesBucket)
    .getPublicUrl(fileName);

  const imageUrl = publicUrlData?.publicUrl ?? null;

  if (!imageUrl) {
    return NextResponse.json({ error: "Failed to get public URL" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    imageUrl,
    message: "Image uploaded successfully.",
  });
}
