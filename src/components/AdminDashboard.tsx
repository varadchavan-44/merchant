"use client";

import { useEffect, useState, useCallback } from "react";
import { OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { AdminProductForm } from "@/components/AdminProductForm";
import { AdminPaymentSettings } from "@/components/AdminPaymentSettings";

interface AdminOrder {
  id: string;
  order_code: string;
  buyer_name: string;
  mobile_number: string;
  id_number: string;
  enrolment_number: string;
  day_scholar: boolean;
  hostel_name: string | null;
  room_number: string | null;
  status: OrderStatus;
  utr: string;
  screenshot_url: string | null;
  ref_code: string | null;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price_paise: number;
    custom_name: string | null;
    custom_number: string | null;
    products: { name: string } | null;
    product_sizes: { size_label: string } | null;
  }[];
}

interface PrintSummaryRow {
  size_label: string;
  commit_threshold: number;
  commit_count: number;
  status: string;
  products: { name: string } | null;
}

const NEXT_ACTIONS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }[]>> = {
  pending_verification: [
    { to: "verified", label: "Verify payment" },
    { to: "cancelled", label: "Reject" },
  ],
  verified: [
    { to: "locked_for_print", label: "Lock for print" },
    { to: "refund_pending", label: "Start refund" },
  ],
  locked_for_print: [{ to: "ready_for_pickup", label: "Mark ready" }],
  ready_for_pickup: [{ to: "picked_up", label: "Check in pickup" }],
  refund_pending: [{ to: "refunded", label: "Mark refunded" }],
};

export function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<{
    printSummary: PrintSummaryRow[];
    referralTotals: Record<string, number>;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const loadOrders = useCallback(async () => {
    const res = await fetch(`/api/admin/orders${statusFilter ? `?status=${statusFilter}` : ""}`);
    const data = await res.json();
    if (res.ok) setOrders(data.orders);
  }, [statusFilter]);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/admin/summary");
    const data = await res.json();
    if (res.ok) setSummary(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag around a data fetch, not derived state
    setLoading(true);
    Promise.all([loadOrders(), loadSummary()]).finally(() => setLoading(false));
  }, [loadOrders, loadSummary]);

  async function transition(orderId: string, to: OrderStatus) {
    setActionError("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error ?? "Action failed.");
      return;
    }
    loadOrders();
    loadSummary();
  }

  if (loading) {
    return <main className="max-w-6xl mx-auto px-6 py-12 text-sm text-ink-soft">Loading…</main>;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display font-medium text-2xl mb-8">Admin</h1>

      <AdminPaymentSettings />
      <AdminProductForm />

      {/* Print summary = the actual print order */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">
          Print summary (verified + committed units)
        </h2>
        <div className="border border-line divide-y divide-line">
          {summary?.printSummary.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>
                {r.products?.name} — {r.size_label}
              </span>
              <span className="mono-num">
                {r.commit_count} / {r.commit_threshold}{" "}
                <span
                  className="text-xs ml-2"
                  style={{ color: r.status === "locked_for_print" ? "var(--ok)" : "var(--ink-soft)" }}
                >
                  {r.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Referral breakdown */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">Referral breakdown</h2>
        <div className="border border-line divide-y divide-line">
          {summary && Object.entries(summary.referralTotals).length === 0 && (
            <p className="px-4 py-2 text-sm text-ink-soft">No referred orders yet.</p>
          )}
          {summary &&
            Object.entries(summary.referralTotals).map(([code, qty]) => (
              <div key={code} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{code}</span>
                <span className="mono-num">{qty} units</span>
              </div>
            ))}
        </div>
      </section>

      {/* Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wide text-ink-soft">Orders</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-line text-sm px-2 py-1 bg-paper-raised"
          >
            <option value="">All statuses</option>
            <option value="pending_verification">Pending verification</option>
            <option value="verified">Verified</option>
            <option value="locked_for_print">Locked for print</option>
            <option value="ready_for_pickup">Ready for pickup</option>
            <option value="picked_up">Picked up</option>
            <option value="cancelled">Cancelled</option>
            <option value="refund_pending">Refund pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {actionError && (
          <p className="text-sm mb-3" style={{ color: "var(--warn)" }}>
            {actionError}
          </p>
        )}

        <div className="border border-line divide-y divide-line text-sm">
          {orders.length === 0 && <p className="px-4 py-3 text-ink-soft">No orders.</p>}
          {orders.map((o) => (
            <div key={o.id} className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="mono-num">{o.order_code}</span>
                  <span>{o.buyer_name}</span>
                  <span className="text-ink-soft">{o.id_number}</span>
                  <span className="text-ink-soft">{o.enrolment_number}</span>
                  <span className="text-ink-soft">{o.mobile_number}</span>
                </div>
                <span
                  className="text-xs uppercase tracking-wide px-2 py-0.5"
                  style={{ background: "var(--signal-soft)", color: "var(--signal)" }}
                >
                  {o.status}
                </span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 text-ink-soft text-xs">
                <span>
                  {o.order_items
                    .map(
                      (i) =>
                        `${i.products?.name} (${i.product_sizes?.size_label}) ×${i.quantity}` +
                        (i.custom_name ? ` [${i.custom_name} #${i.custom_number}]` : "")
                    )
                    .join(", ")}{" "}
                  — {formatPrice(o.order_items.reduce((s, i) => s + i.unit_price_paise * i.quantity, 0))}
                </span>
                <span>
                  {o.day_scholar ? "day scholar" : `${o.hostel_name} · room ${o.room_number}`}
                </span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="mono-num">UTR: {o.utr}</span>
                  {o.screenshot_url && (
                    <a href={o.screenshot_url} target="_blank" className="underline">
                      screenshot
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  {(NEXT_ACTIONS[o.status] ?? []).map((a) => (
                    <button
                      key={a.to}
                      onClick={() => transition(o.id, a.to)}
                      className="px-3 py-1 border border-line hover:border-ink transition-colors"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
