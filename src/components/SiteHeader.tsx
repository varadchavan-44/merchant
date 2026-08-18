import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/CartBadge";

export function SiteHeader({
  overlay = false,
  compact = false,
}: {
  overlay?: boolean;
  compact?: boolean;
}) {
  // Non-overlay pages (cart, status) used to render this fixed at every
  // breakpoint with no top-padding offset on the page content beneath it —
  // on mobile that meant a heavy fixed bar sitting on top of (and partly
  // over) the page title. Matching the overlay pattern (relative on
  // mobile, fixed only from lg up) fixes both: no more overlap, and the
  // bar no longer eats screen real estate while scrolling on a phone.
  const baseClasses = overlay
    ? "sticky top-0 z-30 border-b border-border bg-background lg:fixed lg:inset-x-0 lg:top-0 lg:z-30 lg:border-b-0 lg:bg-transparent"
    : "sticky top-0 z-30 border-b border-border bg-background lg:fixed lg:inset-x-0 lg:top-0 lg:z-30";

  if (compact && !overlay) {
    return (
      <header className={baseClasses}>
        {/* Mobile: slim in-flow bar — small wordmark, no giant logo image,
            can't overlap the page title below it since it isn't fixed. */}
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
            <CartBadge className="text-ink-muted hover:text-ink" />
            <Link href="/status" className="text-ink-muted hover:text-ink transition-colors duration-150">
              Order status
            </Link>
          </nav>
        </div>

        {/* Desktop: unchanged full logo bar. */}
        <div className="hidden lg:flex relative max-w-6xl mx-auto px-6 py-5 items-end justify-between text-ink">
          <Link href="/" className="flex items-end shrink-0">
            <Image
              src="/merchnguys-wordmark.png"
              alt="MerchNguys"
              width={480}
              height={160}
              priority
              className="h-14 sm:h-16 w-auto dark:hidden"
            />
            <Image
              src="/merchnguys-wordmark-dark.png"
              alt="MerchNguys"
              width={480}
              height={160}
              priority
              className="h-14 sm:h-16 w-auto hidden dark:block"
            />
          </Link>
          <nav className="flex items-end gap-6 text-sm pb-0.5">
            <CartBadge className="text-ink-muted hover:text-ink" />
            <Link href="/status" className="text-ink-muted hover:text-ink transition-colors duration-150">
              Order status
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={baseClasses}>
      {overlay && <div className="hidden lg:block photo-scrim-top" aria-hidden="true" />}
      <div
        className={`relative max-w-6xl mx-auto px-6 py-5 flex items-end justify-between ${
          overlay ? "text-ink lg:text-on-photo" : "text-ink"
        }`}
      >
        <Link href="/" className="flex items-end shrink-0">
          {overlay ? (
            <>
              <Image
                src="/merchnguys-wordmark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="h-14 sm:h-16 w-auto dark:hidden lg:hidden"
              />
              <Image
                src="/merchnguys-wordmark-dark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="h-14 sm:h-16 w-auto hidden dark:block lg:hidden"
              />
              <Image
                src="/merchnguys-wordmark-dark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="hidden lg:block h-14 sm:h-16 w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
              />
            </>
          ) : (
            <>
              <Image
                src="/merchnguys-wordmark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="h-14 sm:h-16 w-auto dark:hidden"
              />
              <Image
                src="/merchnguys-wordmark-dark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="h-14 sm:h-16 w-auto hidden dark:block"
              />
            </>
          )}
        </Link>
        <nav className="flex items-end gap-6 text-sm pb-0.5">
          <CartBadge
            className={
              overlay
                ? "text-ink-muted hover:text-ink lg:text-on-photo lg:hover:opacity-80"
                : "text-ink-muted hover:text-ink"
            }
          />
          <Link
            href="/status"
            className={`transition-colors duration-150 ${
              overlay ? "text-ink-muted hover:text-ink lg:hover:opacity-80" : "text-ink-muted hover:text-ink"
            }`}
          >
            Order status
          </Link>
        </nav>
      </div>
    </header>
  );
}
