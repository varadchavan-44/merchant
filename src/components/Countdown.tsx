"use client";

import { useEffect, useState } from "react";

function timeLeft(cutoff: string) {
  const diff = Math.max(0, new Date(cutoff).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes, done: diff === 0 };
}

export function Countdown({ cutoff, extended }: { cutoff: string; extended: boolean }) {
  const [t, setT] = useState(() => timeLeft(cutoff));

  useEffect(() => {
    const id = setInterval(() => setT(timeLeft(cutoff)), 60_000);
    return () => clearInterval(id);
  }, [cutoff]);

  if (t.done) {
    return (
      <span className="mono-num text-sm" style={{ color: "var(--warn)" }}>
        pre-orders closed
      </span>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="mono-num text-sm" suppressHydrationWarning></span>
      <span className="text-xs text-ink-soft">left to commit</span>
      {extended && (
        <span
          className="text-[10px] uppercase tracking-wide px-1.5 py-0.5"
          style={{ background: "var(--warn-soft)", color: "var(--warn)" }}
        >
          extended once
        </span>
      )}
    </div>
  );
}
