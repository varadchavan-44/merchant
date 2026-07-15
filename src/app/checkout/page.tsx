"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/lib/data";

interface Draft {
  productId: string;
  productName: string;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
  unitPricePaise: number;
  buyerName: string;
  rollNo: string;
  phone: string;
  pickupLocation: string;
  refCode?: string;
}

const UPI_ID = "yourvpa@bank"; // TODO: replace with the real collection UPI ID

export default function CheckoutPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("order_draft");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only store on mount, not derived state
    if (raw) setDraft(JSON.parse(raw));
  }, []);

  if (orderCode) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-md mx-auto px-6 py-20 w-full text-center">
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Order submitted</p>
          <p className="mono-num text-3xl mb-4">{orderCode}</p>
          <p className="text-sm text-ink-soft leading-relaxed mb-8">
            We&apos;ll verify your payment against this reference and update your
            status. Save this order code — you&apos;ll need it to check progress.
          </p>
          <Link
            href={`/status?code=${orderCode}`}
            className="inline-block px-5 py-2.5 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity"
          >
            Track this order
          </Link>
        </main>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-md mx-auto px-6 py-20 w-full text-center">
          <p className="text-sm text-ink-soft">
            No order in progress.{" "}
            <Link href="/catalog" className="underline">
              Start from the catalog.
            </Link>
          </p>
        </main>
      </div>
    );
  }

  const total = draft.unitPricePaise * draft.quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!utr.trim()) {
      setError("Enter the UTR / reference number from your payment.");
      return;
    }
    setSubmitting(true);
    setError("");

    const form = new FormData();
    form.set("draft", JSON.stringify(draft));
    form.set("utr", utr.trim());
    if (screenshot) form.set("screenshot", screenshot);

    try {
      const res = await fetch("/api/orders", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      sessionStorage.removeItem("order_draft");
      setOrderCode(data.orderCode);
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-md mx-auto px-6 py-12 w-full">
        <h1 className="font-display font-medium text-2xl mb-8">Pay by UPI</h1>

        <div className="border border-line p-5 mb-8">
          <div className="flex items-baseline justify-between text-sm mb-1">
            <span>{draft.productName}</span>
            <span className="text-ink-soft">size {draft.sizeLabel} × {draft.quantity}</span>
          </div>
          <div className="flex items-baseline justify-between mono-num text-lg mt-3 pt-3 border-t border-line">
            <span className="text-sm font-sans">Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-44 h-44 bg-paper-raised border border-line mx-auto mb-3" />
          <p className="mono-num text-sm">{UPI_ID}</p>
          <p className="text-xs text-ink-soft mt-1">Scan or pay to this ID for the exact amount above.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-ink-soft mb-1.5 block">
              UPI reference / UTR number
            </label>
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 402819XXXXXX"
              className="w-full border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-ink-soft mb-1.5 block">
              Payment screenshot
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--warn)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-5 py-2.5 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit order"}
          </button>
        </form>
      </main>
    </div>
  );
}
