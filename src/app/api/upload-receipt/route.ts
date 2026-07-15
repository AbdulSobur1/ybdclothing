import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq } from "drizzle-orm";
import { withErrorHandling } from "@/lib/api-helpers";

/**
 * POST /api/upload-receipt — Upload a payment receipt for an order.
 */
export const POST = withErrorHandling(async function (request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const orderId = formData.get("orderId") as string | null;

  if (!file || !orderId) {
    return NextResponse.json({ error: "Missing file or order ID" }, { status: 400 });
  }

  // Validate order ownership
  const orderIdNum = parseInt(orderId, 10);
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderIdNum))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Validate file type
  if (!config.storage.allowedFileTypes.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Invalid file type. Allowed: ${config.storage.allowedFileTypes.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > config.storage.maxFileSize) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${config.storage.maxFileSize / 1024 / 1024} MB` },
      { status: 400 },
    );
  }

  // Upload to Supabase Storage
  const supabaseAdmin = createServiceClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${orderIdNum}/${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(config.storage.receiptsBucket)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
  }

  // Update order with receipt URL
  const receiptUrl = `${config.storage.receiptsBucket}/${fileName}`;
  await db
    .update(orders)
    .set({ receiptUrl, updatedAt: new Date() })
    .where(eq(orders.id, orderIdNum));

  return NextResponse.json({
    success: true,
    receiptUrl,
    message: "Receipt uploaded successfully. Your order is pending verification.",
  });
});
