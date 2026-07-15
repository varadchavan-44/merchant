import { createClient } from "@supabase/supabase-js";

/*
  Public (anon/publishable key) client — respects Row Level Security.
  Use this for read-only data that's meant to be publicly visible
  (products, sizes, drop config). Never use this for admin writes —
  those go through supabase-admin.ts's service-role client instead,
  inside API routes only.
*/
export function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
