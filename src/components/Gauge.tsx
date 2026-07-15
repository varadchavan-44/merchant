import { SizeStatus } from "@/lib/types";

export function Gauge({
  count,
  threshold,
  status,
  label,
}: {
  count: number;
  threshold: number;
  status: SizeStatus;
  label: string;
}) {
  const pct = Math.min(100, Math.round((count / threshold) * 100));
  const locked = status === "locked_for_print";
  const fillColor = locked ? "var(--ok)" : "var(--signal)";
  const ticks = Array.from({ length: 6 });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wide text-ink-soft">{label}</span>
        <span className="mono-num text-xs">
          <span style={{ color: fillColor }}>{count}</span>
          <span className="text-ink-soft"> / {threshold}</span>
        </span>
      </div>
      <div className="gauge">
        <div className="gauge-ticks">
          {ticks.map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <div
          className="gauge-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      {locked && (
        <p className="mono-num text-[11px] mt-1.5" style={{ color: "var(--ok)" }}>
          threshold met — locked for print
        </p>
      )}
    </div>
  );
}
