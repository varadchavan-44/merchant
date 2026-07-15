# VNIT Drop — merch pre-order site

Commit-then-print merch store: buyers commit to a size, pay by UPI, and a
size only gets printed once it hits its threshold. No stock guessing, no
payment gateway KYC, no shipping — campus pickup only.

## Stack
Next.js (App Router) + Tailwind + Supabase (Postgres, Storage). Deploys to
Vercel.

## One-time setup

1. **Create a Supabase project** at supabase.com (free tier is plenty for this scale).
2. **Run the schema.** Supabase dashboard → SQL Editor → New query → paste
   the contents of `supabase/schema.sql` → Run. This creates every table,
   the commit-count triggers, and the duplicate-UTR guard.
3. **Create a storage bucket** named `payment-screenshots`, set to public
   read (Storage → New bucket → toggle "Public").
4. **Add your products.** Either via the Supabase Table Editor directly
   (`products` and `product_sizes` tables), or ask me to build a quick
   admin "add product" form if you'd rather not touch the dashboard.
5. **Set the real pre-order cutoff** in the `drop_config` table (it defaults
   to 14 days from whenever you ran the schema).
6. **Copy `.env.example` to `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase
     dashboard → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, the secret one. Never expose
     this to the browser or commit it.
   - `ADMIN_PASSWORD` — any password, shared across whoever needs `/admin`
7. **Swap the mock data layer for real queries.** `src/lib/data.ts` currently
   returns mock products so the site is previewable without Supabase
   connected. Each function has the real Supabase query commented directly
   above it — swap the body, nothing else changes.
8. **Set your real UPI ID** in `src/app/checkout/page.tsx` (`UPI_ID` constant)
   and drop in a real QR code image where the placeholder box is.

## Running locally

```
npm install
npm run dev
```

## Deploying

Push to GitHub, import the repo on Vercel, add the same env vars from
`.env.local` in the Vercel project settings. Done — no other config needed.

## How the admin dashboard works

Go to `/admin`, enter the shared `ADMIN_PASSWORD`. From there:
- **Print summary** — live per-size commit totals. This is your literal
  print order once sizes lock.
- **Orders** — verify payments (checks against your bank/UPI statement,
  not just the screenshot), lock for print, mark ready, check in pickups.
- **Referral breakdown** — units credited per `?ref=` code, for splitting
  credit later.

## What's not wired up yet
- Referrer codes exist in the schema but there's no admin UI yet to add
  your friends' codes — insert rows into `referrers` directly for now.
- The "extend cutoff once, then refund if still short" logic is a manual
  admin action for now (update `drop_config`, then move short-of-threshold
  orders to `refund_pending`) rather than automatic — worth automating
  once the drop is actually running and we see real usage patterns.
