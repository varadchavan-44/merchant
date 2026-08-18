import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/CartBadge";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? "relative border-b border-border bg-background lg:fixed lg:inset-x-0 lg:top-0 lg:z-30 lg:border-b-0 lg:bg-transparent"
          : "fixed inset-x-0 top-0 z-30 border-b border-border bg-background"
      }
    >
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
