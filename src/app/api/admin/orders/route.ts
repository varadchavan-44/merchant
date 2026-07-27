import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const status = req.nextUrl.searchParams.get("status");

  let query = supabase
    .from("orders")
    .select(
      "id, order_code, buyer_name, mobile_number, id_number, enrolment_number, day_scholar, hostel_name, room_number, status, utr, screenshot_url, ref_code, created_at, order_items(id, quantity, unit_price_paise, products(name), product_sizes(size_label))"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Fetch failed." }, { status: 500 });

  return NextResponse.json({ orders: data });
}
