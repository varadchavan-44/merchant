import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { BuyerDetails, CartItem } from "@/lib/types";

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
  const itemsRaw = form.get("items");
  const buyerRaw = form.get("buyer");
  const refCode = form.get("refCode");
  const utr = form.get("utr");
  const screenshot = form.get("screenshot") as File | null;

  if (typeof itemsRaw !== "string" || typeof buyerRaw !== "string" || typeof utr !== "string" || !utr.trim()) {
    return NextResponse.json({ error: "Missing order details or UTR." }, { status: 400 });
  }

  const items = JSON.parse(itemsRaw) as CartItem[];
  const buyer = JSON.parse(buyerRaw) as BuyerDetails;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Every buyer field is mandatory, except hostel/room which only apply
  // to non-day-scholars.
  if (!buyer.name?.trim() || !buyer.mobile?.trim() || !buyer.idNumber?.trim() || !buyer.enrolmentNumber?.trim()) {
    return NextResponse.json(
      { error: "Name, mobile number, ID number, and enrolment number are all required." },
      { status: 400 }
    );
  }
  if (!buyer.dayScholar && (!buyer.hostelName?.trim() || !buyer.roomNumber?.trim())) {
    return NextResponse.json(
      { error: "Hostel name and room number are required unless you're a day scholar." },
      { status: 400 }
    );
  }

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
        buyer_name: buyer.name,
        mobile_number: buyer.mobile,
        id_number: buyer.idNumber,
        enrolment_number: buyer.enrolmentNumber,
        day_scholar: buyer.dayScholar,
        hostel_name: buyer.dayScholar ? null : buyer.hostelName,
        room_number: buyer.dayScholar ? null : buyer.roomNumber,
        ref_code: (typeof refCode === "string" && refCode) || null,
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

  const orderItemRows = items.flatMap((item) => {
    if (item.customizations && item.customizations.length > 0) {
      // One row per unit so each shirt's name/number is unambiguous.
      return item.customizations.map((c) => ({
        order_id: order!.id,
        product_id: item.productId,
        size_id: item.sizeId,
        quantity: 1,
        unit_price_paise: item.unitPricePaise,
        custom_name: c.name as string | null,
        custom_number: c.number as string | null,
      }));
    }
    return [
      {
        order_id: order!.id,
        product_id: item.productId,
        size_id: item.sizeId,
        quantity: item.quantity,
        unit_price_paise: item.unitPricePaise,
        custom_name: null as string | null,
        custom_number: null as string | null,
      },
    ];
  });

  const { error: itemError } = await supabase.from("order_items").insert(orderItemRows);

  if (itemError) {
    return NextResponse.json({ error: "Order created but items failed — contact admin." }, { status: 500 });
  }

  return NextResponse.json({ orderCode: usedOrderCode });
}
