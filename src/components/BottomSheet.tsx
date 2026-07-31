"use client";

import { useEffect, useRef, useState } from "react";

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Keep the sheet mounted through its exit transition instead of
  // unmounting the instant `open` flips false.
  const [mounted, setMounted] = useState(open);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mounting ahead of the open transition to sync with the CSS animation, not derived state
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted) return null;

  function handleTransitionEnd() {
    if (!open) setMounted(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (delta > 60) onClose();
  }

  return (
    <>
      <div
        className={`sheet-backdrop ${open ? "sheet-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`sheet-panel ${open ? "sheet-open" : ""}`}
        role="dialog"
        aria-modal="true"
        onTransitionEnd={handleTransitionEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sheet-handle" />
        <div className="px-6 pb-8 pt-2">{children}</div>
      </div>
    </>
  );
}
