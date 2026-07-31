"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartCount, getCart } from "@/lib/cart";

export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(cartCount(getCart()));
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, []);

  return (
    <Link href="/cart" className="text-ink-muted hover:text-ink transition-colors duration-150">
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
