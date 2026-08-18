import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/CartBadge";

const navLinkClass = "nav-label text-ink-muted hover:text-ink transition-colors duration-150";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  // Header is always solid and always sticky — no scroll-hide, no
  // transparent-over-photo variant. One treatment everywhere.
  const baseClasses =
    "sticky top-0 z-30 border-b border-border bg-background lg:fixed lg:inset-x-0 lg:top-0 lg:z-30";

  if (compact) {
    return (
      <header className={baseClasses}>
        <div className="lg:hidden flex items-center gap-3 px-5 py-3 text-ink">
          <Link
            href="/"
            aria-label="Back to home"
            className="shrink-0 text-ink-muted hover:text-ink transition-colors duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link href="/" className="headline text-sm tracking-wide truncate">
            MerchNguys
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-xs shrink-0">
            <CartBadge className={navLinkClass} />
            <Link href="/status" className={navLinkClass}>
              Order status
            </Link>
          </nav>
        </div>

        <div className="hidden lg:flex relative max-w-6xl mx-auto px-6 py-5 items-end justify-between text-ink">
          <Link href="/" className="flex items-end shrink-0">
            <Image src="/merchnguys-wordmark.png" alt="MerchNguys" width={480} height={160} priority className="h-14 sm:h-16 w-auto dark:hidden" />
            <Image src="/merchnguys-wordmark-dark.png" alt="MerchNguys" width={480} height={160} priority className="h-14 sm:h-16 w-auto hidden dark:block" />
          </Link>
          <nav className="flex items-end gap-6 text-sm pb-0.5">
            <CartBadge className={navLinkClass} />
            <Link href="/status" className={navLinkClass}>
              Order status
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={baseClasses}>
      <div className="relative max-w-6xl mx-auto px-6 py-5 flex items-end justify-between text-ink">
        <Link href="/" className="flex items-end shrink-0">
          <Image src="/merchnguys-wordmark.png" alt="MerchNguys" width={480} height={160} priority className="h-14 sm:h-16 w-auto dark:hidden" />
          <Image src="/merchnguys-wordmark-dark.png" alt="MerchNguys" width={480} height={160} priority className="h-14 sm:h-16 w-auto hidden dark:block" />
        </Link>
        <nav className="flex items-end gap-6 text-sm pb-0.5">
          <CartBadge className={navLinkClass} />
          <Link href="/status" className={navLinkClass}>
            Order status
          </Link>
        </nav>
      </div>
    </header>
  );
}
