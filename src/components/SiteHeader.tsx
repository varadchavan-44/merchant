import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display font-medium tracking-tight text-lg">
          DROP
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/catalog" className="text-ink-soft hover:text-ink transition-colors">
            Catalog
          </Link>
          <Link href="/status" className="text-ink-soft hover:text-ink transition-colors">
            Track order
          </Link>
          <CartBadge />
        </nav>
      </div>
    </header>
  );
}
