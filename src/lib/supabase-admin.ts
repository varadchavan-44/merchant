import { createClient } from "@supabase/supabase-js";

/*
  Service-role client. This bypasses Row Level Security, so it must
  only ever be imported inside src/app/api/** route handlers — never
  in a client component, and never in a server component whose output
  reaches the browser. The service role key must live only in
  SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) so Next.js never
  bundles it into client JS.
*/
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
