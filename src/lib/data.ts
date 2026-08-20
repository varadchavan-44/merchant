import { Product, DropConfig } from "./types";
import { getSupabasePublic } from "./supabase-public";

/*
  Data layer — now wired to real Supabase queries. If Supabase isn't
  connected yet (.env.local missing), each function falls back to an
  empty/default result rather than crashing the page, so the site
  stays viewable even before setup is finished.
*/

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabasePublic();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*, sizes:product_sizes(*), images:product_images(*)")
    .eq("active", true)
    .order("sort_order");

  if (error || !data) return [];
  return (data as Product[]).map((p) => ({
    ...p,
    images: [...p.images].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = getSupabasePublic();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*, sizes:product_sizes(*), images:product_images(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const product = data as Product;
  return { ...product, images: [...product.images].sort((a, b) => a.sort_order - b.sort_order) };
}

export async function getDropConfig(): Promise<DropConfig> {
  const supabase = getSupabasePublic();
  const fallback: DropConfig = {
    cutoff_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    extended: false,
    upi_id: null,
    qr_image_url: null,
  };
  if (!supabase) return fallback;

  const { data, error } = await supabase.from("drop_config").select("*").single();
  if (error || !data) return fallback;
  return data as DropConfig;
}

export function totalCommits(products: Product[]): number {
  return products.reduce(
    (sum, p) => sum + p.sizes.reduce((s, sz) => s + sz.commit_count, 0),
    0
  );
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
