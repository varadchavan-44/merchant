import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const form = await req.formData();
  const upiId = form.get("upi_id");
  const qrImage = form.get("qr_image") as File | null;

  const update: { upi_id?: string; qr_image_url?: string } = {};

  if (typeof upiId === "string" && upiId.trim()) {
    update.upi_id = upiId.trim();
  }

  if (qrImage && qrImage.size > 0) {
    const safeName = qrImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `qr/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, qrImage);
    if (uploadError) {
      return NextResponse.json({ error: `QR upload failed: ${uploadError.message}` }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    update.qr_image_url = pub.publicUrl;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Provide a UPI ID and/or a QR image." }, { status: 400 });
  }

  const { error } = await supabase.from("drop_config").update(update).eq("id", 1);
  if (error) return NextResponse.json({ error: "Could not update payment config." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
