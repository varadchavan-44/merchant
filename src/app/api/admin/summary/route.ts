import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const { data: sizes, error: sizesError } = await supabase
    .from("product_sizes")
    .select("size_label, commit_threshold, commit_count, status, products(name)");

  if (sizesError) return NextResponse.json({ error: "Fetch failed." }, { status: 500 });

  const { data: refOrders, error: refError } = await supabase
    .from("orders")
    .select("ref_code, status, order_items(quantity)")
    .not("ref_code", "is", null)
    .in("status", ["verified", "locked_for_print", "ready_for_pickup", "picked_up"]);

  if (refError) return NextResponse.json({ error: "Fetch failed." }, { status: 500 });

  const referralTotals: Record<string, number> = {};
  for (const o of refOrders ?? []) {
    const qty = (o.order_items ?? []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
    if (o.ref_code) referralTotals[o.ref_code] = (referralTotals[o.ref_code] ?? 0) + qty;
  }

  return NextResponse.json({ printSummary: sizes, referralTotals });
}
