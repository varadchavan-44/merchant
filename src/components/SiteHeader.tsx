import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const tone = overlay ? "text-on-ink mix-blend-difference" : "text-ink";
  const mutedTone = overlay ? "text-current" : "text-ink-muted hover:text-ink";

  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-30" : "border-b border-border"}>
      <div className={`max-w-6xl mx-auto px-6 py-5 flex items-center justify-between ${tone}`}>
        <Link href="/" className="font-body font-medium tracking-[-0.05em] text-lg">
          VNIT / MERCH
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <CartBadge className={mutedTone} />
          <Link href="/status" className={`${mutedTone} transition-colors duration-150`}>
            Order status
          </Link>
        </nav>
      </div>
    </header>
  );
}
