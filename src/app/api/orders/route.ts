import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function generateOrderCode() {
  // 6 digits (100000-999999) — 900,000 possible codes instead of the
  // original 9,000, so real collisions become vanishingly rare even
  // at a few thousand orders. We still retry on collision below as a
  // second line of defense, since "rare" isn't "impossible."
  const n = Math.floor(100000 + Math.random() * 900000);
  return `MHT-${n}`;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase isn't connected yet. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, run supabase/schema.sql, then this endpoint will work as-is.",
      },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const draftRaw = form.get("draft");
  const utr = form.get("utr");
  const screenshot = form.get("screenshot") as File | null;

  if (typeof draftRaw !== "string" || typeof utr !== "string" || !utr.trim()) {
    return NextResponse.json({ error: "Missing order details or UTR." }, { status: 400 });
  }

  const draft = JSON.parse(draftRaw);

  let screenshotUrl: string | null = null;
  if (screenshot && screenshot.size > 0) {
    const path = `screenshots/${Date.now()}-${screenshot.name}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(path, screenshot);
    if (uploadError) {
      return NextResponse.json({ error: "Screenshot upload failed." }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from("payment-screenshots").getPublicUrl(path);
    screenshotUrl = pub.publicUrl;
  }

  // Try a few times in case of an order_code collision — that's a
  // separate unique constraint from the UTR one, and colliding on it
  // is not a fraud signal, just bad luck on a random number.
  let order: { id: string } | null = null;
  let orderError: { code?: string; message?: string } | null = null;
  let usedOrderCode = "";
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const orderCode = generateOrderCode();
    usedOrderCode = orderCode;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_code: orderCode,
        buyer_name: draft.buyerName,
        roll_no: draft.rollNo,
        branch: draft.branch || null,
        year: draft.year || null,
        phone: draft.phone,
        pickup_location: draft.pickupLocation,
        ref_code: draft.refCode || null,
        utr: utr.trim(),
        screenshot_url: screenshotUrl,
      })
      .select()
      .single();

    if (!error) {
      order = data;
      orderError = null;
      break;
    }

    orderError = error;
    // Only retry if it was specifically order_code that collided.
    // Anything else (including a UTR collision) stops immediately.
    const isOrderCodeCollision = error.code === "23505" && error.message?.includes("order_code");
    if (!isOrderCodeCollision) break;
  }

  if (!order) {
    // unique_violation on orders.utr — that's the duplicate-UTR guard firing
    if (orderError?.code === "23505" && orderError.message?.includes("utr")) {
      return NextResponse.json(
        { error: "This payment reference has already been used on another order." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not create order." }, { status: 500 });
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: draft.productId,
    size_id: draft.sizeId,
    quantity: draft.quantity,
    unit_price_paise: draft.unitPricePaise,
  });

  if (itemError) {
    return NextResponse.json({ error: "Order created but item failed — contact admin." }, { status: 500 });
  }

  return NextResponse.json({ orderCode: usedOrderCode });
}
