import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border px-5 py-8 lg:px-10 lg:py-10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-ink-soft">
          © {new Date().getFullYear()} MerchNguys. All sales subject to our{" "}
          <Link href="/legal" className="underline hover:text-ink transition-colors duration-150">
            terms &amp; policy
          </Link>
          .
        </p>
        <a
          href="mailto:merchnguys@gmail.com"
          className="text-xs text-ink-soft underline hover:text-ink transition-colors duration-150"
        >
          merchnguys@gmail.com
        </a>
      </div>
    </footer>
  );
}
