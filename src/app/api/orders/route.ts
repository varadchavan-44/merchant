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

  // Cart quantity lives in sessionStorage and is fully editable via
  // devtools — the "max 5" limit in the UI is not enforced anywhere
  // server-side without this check. Doesn't affect money (price is
  // verified below regardless), but an unbounded quantity could distort
  // a commit-then-print threshold or just create an unexpected order.
  const MAX_QTY_PER_LINE = 5;
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_LINE) {
      return NextResponse.json({ error: "Quantity per size must be between 1 and 5." }, { status: 400 });
    }
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

  // SECURITY: unitPricePaise on each cart item comes from the browser and
  // must never be trusted — anyone can edit it via devtools before
  // checkout. Look up the real price per product from the DB here, verify
  // each size actually belongs to the claimed product, and use only the
  // DB price when building order_items below.
  const sizeIds = [...new Set(items.map((i) => i.sizeId))];
  const { data: sizeRows, error: sizeLookupError } = await supabase
    .from("product_sizes")
    .select("id, product_id, products(price_paise, active, is_customizable, requires_number)")
    .in("id", sizeIds);

  if (sizeLookupError) {
    return NextResponse.json({ error: "Could not verify cart contents." }, { status: 500 });
  }

  type SizeRow = {
    id: string;
    product_id: string;
    products: { price_paise: number; active: boolean; is_customizable: boolean; requires_number: boolean } | null;
  };
  const sizeMap = new Map<string, SizeRow>((sizeRows as SizeRow[]).map((r) => [r.id, r]));

  for (const item of items) {
    const row = sizeMap.get(item.sizeId);
    if (!row || !row.products) {
      return NextResponse.json({ error: "One of the items in your cart no longer exists." }, { status: 400 });
    }
    if (row.product_id !== item.productId) {
      return NextResponse.json({ error: "Cart contents don't match — please refresh and try again." }, { status: 400 });
    }
    if (!row.products.active) {
      return NextResponse.json({ error: "One of the items in your cart is no longer available." }, { status: 400 });
    }
    if (row.products.is_customizable) {
      const units = item.customizations ?? [];
      if (units.length !== item.quantity) {
        return NextResponse.json({ error: "Missing name/number details for one of your items." }, { status: 400 });
      }
      for (const u of units) {
        if (!u.name || !u.name.trim()) {
          return NextResponse.json({ error: "Enter a name for every shirt." }, { status: 400 });
        }
        if (row.products.requires_number && (!u.number || !u.number.trim())) {
          return NextResponse.json({ error: "Enter a number for every shirt." }, { status: 400 });
        }
      }
    }
  }

  let screenshotUrl: string | null = null;
  if (screenshot && screenshot.size > 0) {
    if (!screenshot.type.startsWith("image/")) {
      return NextResponse.json({ error: "Payment screenshot must be an image file." }, { status: 400 });
    }
    const safeName = screenshot.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
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
    // Guaranteed present and validated above — this is the real price,
    // never item.unitPricePaise from the client.
    const verifiedPrice = sizeMap.get(item.sizeId)!.products!.price_paise;

    if (item.customizations && item.customizations.length > 0) {
      // One row per unit so each shirt's name/number is unambiguous.
      return item.customizations.map((c) => ({
        order_id: order!.id,
        product_id: item.productId,
        size_id: item.sizeId,
        quantity: 1,
        unit_price_paise: verifiedPrice,
        custom_name: c.name as string | null,
        custom_number: (c.number ?? null) as string | null,
      }));
    }
    return [
      {
        order_id: order!.id,
        product_id: item.productId,
        size_id: item.sizeId,
        quantity: item.quantity,
        unit_price_paise: verifiedPrice,
        custom_name: null as string | null,
        custom_number: null as string | null,
      },
    ];
  });

  const { error: itemError } = await supabase.from("order_items").insert(orderItemRows);

  if (itemError) {
    // Items failed to insert after the order row (and its UTR) were
    // already committed. Without cleanup, the UTR stays permanently
    // claimed by an empty order and the buyer can never retry — even
    // though nothing was actually recorded for their payment. Delete the
    // orphaned order so the UTR frees up and they can simply try again.
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "Something went wrong creating your order — please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ orderCode: usedOrderCode });
}

