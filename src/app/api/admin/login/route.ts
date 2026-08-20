import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function getClientIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for; the first entry is the original client.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not set on the server." }, { status: 500 });
  }

  const ip = getClientIp(req);
  const supabase = getSupabaseAdmin();

  // If Supabase isn't connected yet (early setup), fall back to a plain
  // password check rather than blocking admin access entirely — rate
  // limiting degrades gracefully instead of locking everyone out.
  if (supabase) {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.` },
        { status: 429 }
      );
    }
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    if (supabase) {
      await supabase.from("admin_login_attempts").insert({ ip });
    }
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
