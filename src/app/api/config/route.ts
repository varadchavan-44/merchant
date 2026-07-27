import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("drop_config")
    .select("upi_id, qr_image_url")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not load payment config." }, { status: 500 });
  }

  return NextResponse.json(data);
}
