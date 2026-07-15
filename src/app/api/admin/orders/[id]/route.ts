import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { OrderStatus } from "@/lib/types";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_verification: ["verified", "cancelled"],
  verified: ["locked_for_print", "cancelled", "refund_pending"],
  locked_for_print: ["ready_for_pickup"],
  ready_for_pickup: ["picked_up"],
  picked_up: [],
  cancelled: [],
  refund_pending: ["refunded"],
  refunded: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const { id } = await params;
  const { status: nextStatus } = (await req.json()) as { status: OrderStatus };

  const { data: current, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[current.status as OrderStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Can't move from ${current.status} to ${nextStatus}.` },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "verified") patch.verified_at = new Date().toISOString();
  if (nextStatus === "locked_for_print") patch.edit_locked = true;

  const { error: updateError } = await supabase.from("orders").update(patch).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Update failed." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
