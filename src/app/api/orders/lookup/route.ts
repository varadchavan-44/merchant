import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!code && !phone) {
    return NextResponse.json({ error: "Provide an order code or phone number." }, { status: 400 });
  }

  let query = supabase.from("orders").select(
    "order_code, status, buyer_name, pickup_location, created_at, order_items(quantity, products(name), product_sizes(size_label))"
  );

  query = code ? query.eq("order_code", code) : query.eq("phone", phone);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No matching order found." }, { status: 404 });
  }

  return NextResponse.json({ orders: data });
}
