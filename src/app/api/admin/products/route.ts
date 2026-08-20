import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const { data, error } = await supabase
    .from("products")
    .select("*, sizes:product_sizes(*), images:product_images(*)")
    .order("sort_order");

  if (error) return NextResponse.json({ error: "Fetch failed." }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase isn't connected yet." }, { status: 503 });

  const form = await req.formData();
  const name = form.get("name");
  const description = form.get("description");
  const pricePaiseRaw = form.get("price_paise");
  const sizesRaw = form.get("sizes"); // JSON string: [{ size_label, commit_threshold }, ...]
  const image = form.get("image") as File | null;
  const images = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const isCustomizableRaw = form.get("is_customizable");

  if (images.length > 6) {
    return NextResponse.json({ error: "Up to 6 images per product." }, { status: 400 });
  }

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }
  if (typeof pricePaiseRaw !== "string" || !Number.isFinite(Number(pricePaiseRaw))) {
    return NextResponse.json({ error: "Valid price is required." }, { status: 400 });
  }
  if (typeof sizesRaw !== "string") {
    return NextResponse.json({ error: "At least one size is required." }, { status: 400 });
  }

  let sizes: { size_label: string; commit_threshold: number }[];
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

  let imageUrl = "";
  if (image && image.size > 0) {
    const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, image);
    if (uploadError) {
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }

  const galleryUrls: string[] = [];
  for (const img of images) {
    const safeName = img.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, img);
    if (uploadError) {
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    galleryUrls.push(pub.publicUrl);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      image_url: imageUrl || galleryUrls[0] || "",
      price_paise: Math.round(Number(pricePaiseRaw)),
      is_customizable: isCustomizableRaw === "true",
    })
    .select()
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }

  const { error: sizesError } = await supabase.from("product_sizes").insert(
    sizes.map((s) => ({
      product_id: product.id,
      size_label: s.size_label,
      commit_threshold: Math.round(Number(s.commit_threshold)),
    }))
  );

  if (sizesError) {
    return NextResponse.json(
      { error: "Product created but sizes failed — check the product in Supabase and add sizes manually." },
      { status: 500 }
    );
  }

  if (galleryUrls.length > 0) {
    await supabase.from("product_images").insert(
      galleryUrls.map((url, i) => ({ product_id: product.id, url, sort_order: i }))
    );
  }

  return NextResponse.json({ product });
}
