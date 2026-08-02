"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartCount, getCart } from "@/lib/cart";

export function CartBadge({ className = "text-ink-muted hover:text-ink" }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(cartCount(getCart()));
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, []);

  return (
    <Link href="/cart" className={`${className} transition-colors duration-150 flex items-center gap-1.5`}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span>Cart</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-ink text-[10px] font-semibold leading-none">
          {count}
        </span>
      )}
    </Link>
  );
}
