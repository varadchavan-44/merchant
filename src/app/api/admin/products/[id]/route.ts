import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const form = await req.formData();
  const name = form.get("name");
  const description = form.get("description");
  const pricePaiseRaw = form.get("price_paise");
  const sizesRaw = form.get("sizes"); // JSON string: [{ id?, size_label, commit_threshold }, ...]
  const image = form.get("image") as File | null;
  const activeRaw = form.get("active");

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }
  if (typeof pricePaiseRaw !== "string" || !Number.isFinite(Number(pricePaiseRaw))) {
    return NextResponse.json({ error: "Valid price is required." }, { status: 400 });
  }
  if (typeof sizesRaw !== "string") {
    return NextResponse.json({ error: "At least one size is required." }, { status: 400 });
  }

  let sizes: { id?: string; size_label: string; commit_threshold: number }[];
  try {
    sizes = JSON.parse(sizesRaw);
  } catch {
    return NextResponse.json({ error: "Malformed sizes payload." }, { status: 400 });
  }
  if (!Array.isArray(sizes) || sizes.length === 0) {
    return NextResponse.json({ error: "At least one size is required." }, { status: 400 });
  }
  for (const s of sizes) {
    if (!s.size_label || !Number.isFinite(Number(s.commit_threshold)) || Number(s.commit_threshold) <= 0) {
      return NextResponse.json({ error: "Each size needs a label and a threshold > 0." }, { status: 400 });
    }
  }

  const update: {
    name: string;
    description: string;
    price_paise: number;
    image_url?: string;
    active?: boolean;
  } = {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : "",
    price_paise: Math.round(Number(pricePaiseRaw)),
  };

  if (typeof activeRaw === "string") {
    update.active = activeRaw === "true";
  }

  if (image && image.size > 0) {
    const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, image);
    if (uploadError) {
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    update.image_url = pub.publicUrl;
  }

  const { error: productError } = await supabase.from("products").update(update).eq("id", id);
  if (productError) {
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }

  // Reconcile sizes: update existing rows (by id), insert new rows (no id),
  // and delete rows that were removed from the form. A size with existing
  // committed orders can't be deleted at the DB level (order_items still
  // reference it) — if that delete fails, we leave the row in place rather
  // than failing the whole save, since the label/threshold edits above
  // already went through.
  const existingIds = sizes.filter((s) => s.id).map((s) => s.id as string);

  const { data: currentSizes } = await supabase
    .from("product_sizes")
    .select("id")
    .eq("product_id", id);

  const toDelete = (currentSizes ?? [])
    .map((s) => s.id as string)
    .filter((sizeId) => !existingIds.includes(sizeId));

  const warnings: string[] = [];

  for (const sizeId of toDelete) {
    const { error: delError } = await supabase.from("product_sizes").delete().eq("id", sizeId);
    if (delError) {
      warnings.push("One size couldn't be removed because it already has orders against it.");
    }
  }

  for (const s of sizes) {
    if (s.id) {
      const { error: sizeUpdateError } = await supabase
        .from("product_sizes")
        .update({ size_label: s.size_label, commit_threshold: Math.round(Number(s.commit_threshold)) })
        .eq("id", s.id);
      if (sizeUpdateError) {
        warnings.push(`Could not update size "${s.size_label}".`);
      }
    } else {
      const { error: sizeInsertError } = await supabase
        .from("product_sizes")
        .insert({ product_id: id, size_label: s.size_label, commit_threshold: Math.round(Number(s.commit_threshold)) });
      if (sizeInsertError) {
        warnings.push(`Could not add size "${s.size_label}".`);
      }
    }
  }

  return NextResponse.json({ ok: true, warnings });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  // Try a real delete first. product_sizes cascades from products, but if
  // any order_items reference those sizes, the cascade hits a foreign-key
  // restriction and the whole delete is rolled back automatically — safe
  // by default. In that case we fall back to archiving (active = false)
  // instead of losing order history.
  const { error: deleteError } = await supabase.from("products").delete().eq("id", id);

  if (!deleteError) {
    return NextResponse.json({ ok: true, deleted: true });
  }

  const isForeignKeyRestriction = deleteError.code === "23503";
  if (!isForeignKeyRestriction) {
    return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
  }

  const { error: archiveError } = await supabase.from("products").update({ active: false }).eq("id", id);
  if (archiveError) {
    return NextResponse.json({ error: "Could not delete or archive product." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: false,
    archived: true,
    message: "This product has existing orders, so it was archived (hidden from the catalog) instead of deleted.",
  });
}
