import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/CartBadge";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-30" : "border-b border-border"}>
      {/*
        Fixed dark scrim instead of mix-blend-difference: the wordmark stays
        readable no matter what the underlying photo looks like, instead of
        vanishing when the photo's tone happens to match the ink color.
      */}
      {overlay && <div className="photo-scrim-top" aria-hidden="true" />}

      <div
        className={`relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between ${
          overlay ? "text-on-ink" : "text-ink"
        }`}
      >
        <Link href="/" className="flex items-center shrink-0">
          {overlay ? (
            <Image
              src="/merchnguys-wordmark-dark.png"
              alt="MerchNguys"
              width={480}
              height={160}
              priority
              className="h-8 w-auto"
            />
          ) : (
            <>
              <Image
                src="/merchnguys-wordmark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/merchnguys-wordmark-dark.png"
                alt="MerchNguys"
                width={480}
                height={160}
                priority
                className="h-8 w-auto hidden dark:block"
              />
            </>
          )}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <CartBadge
            className={overlay ? "text-on-ink hover:opacity-80" : "text-ink-muted hover:text-ink"}
          />
          <Link
            href="/status"
            className={`transition-colors duration-150 ${overlay ? "hover:opacity-80" : "text-ink-muted hover:text-ink"}`}
          >
            Order status
          </Link>
        </nav>
      </div>
    </header>
  );
}
