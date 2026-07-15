import { OrderStatus } from "@/lib/types";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending_verification", label: "Payment submitted" },
  { key: "verified", label: "Payment verified" },
  { key: "locked_for_print", label: "Locked for print" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "picked_up", label: "Picked up" },
];

export function OrderStatusTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "refund_pending" || status === "refunded") {
    const copy =
      status === "cancelled"
        ? "This order was cancelled."
        : status === "refund_pending"
        ? "Size didn't reach threshold — refund in progress."
        : "Refunded.";
    return (
      <div className="border p-4" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)" }}>
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {copy}
        </p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={s.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: done || current ? "var(--ok)" : "var(--line)",
                  outline: current ? "3px solid var(--ok-soft)" : "none",
                }}
              />
              {i < STEPS.length - 1 && (
                <div
                  className="w-px flex-1 my-1"
                  style={{ background: done ? "var(--ok)" : "var(--line)", minHeight: "1.75rem" }}
                />
              )}
            </div>
            <div className="pb-6">
              <p
                className="text-sm mono-num"
                style={{ color: done || current ? "var(--ink)" : "var(--ink-soft)" }}
              >
                {String(i + 1).padStart(2, "0")} — {s.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
