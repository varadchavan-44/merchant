"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { OrderStatusTracker } from "@/components/OrderStatusTracker";
import { OrderStatus } from "@/lib/types";

interface OrderResult {
  order_code: string;
  status: OrderStatus;
  buyer_name: string;
  pickup_location: string;
}

function StatusInner() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("code") ?? "");
  const [mode, setMode] = useState<"code" | "phone">("code");
  const [results, setResults] = useState<OrderResult[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runLookup(q: string, m: "code" | "phone") {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch(`/api/orders/lookup?${m}=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lookup failed.");
      } else {
        setResults(data.orders);
      }
    } catch {
      setError("Network error — try again.");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch triggered by a URL param on mount
    if (params.get("code")) runLookup(params.get("code")!, "code");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex-1 max-w-md mx-auto px-6 py-12 w-full">
      <h1 className="font-display font-medium text-2xl mb-8">Track order</h1>

      <div className="flex gap-2 mb-4 text-sm">
        <button
          onClick={() => setMode("code")}
          className={mode === "code" ? "font-medium border-b border-ink" : "text-ink-soft"}
        >
          By order code
        </button>
        <span className="text-ink-soft">/</span>
        <button
          onClick={() => setMode("phone")}
          className={mode === "phone" ? "font-medium border-b border-ink" : "text-ink-soft"}
        >
          By phone
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runLookup(query, mode);
        }}
        className="flex gap-2 mb-10"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "code" ? "MHT-2481" : "10-digit phone"}
          className="flex-1 border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity"
        >
          {loading ? "…" : "Look up"}
        </button>
      </form>

      {error && (
        <p className="text-sm mb-6" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      {results?.map((o) => (
        <div key={o.order_code} className="mb-10">
          <div className="flex items-baseline justify-between mb-6">
            <span className="mono-num text-lg">{o.order_code}</span>
            <span className="text-sm text-ink-soft">{o.pickup_location}</span>
          </div>
          <OrderStatusTracker status={o.status} />
        </div>
      ))}
    </main>
  );
}

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <Suspense fallback={null}>
        <StatusInner />
      </Suspense>
    </div>
  );
}
