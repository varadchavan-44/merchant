import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-body font-medium tracking-tight text-lg">
          Drop
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <CartBadge />
          <Link href="/status" className="text-ink-muted hover:text-ink transition-colors duration-150">
            Order status
          </Link>
        </nav>
      </div>
    </header>
  );
}
