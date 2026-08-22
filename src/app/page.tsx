import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeReveal } from "@/components/HomeReveal";
import { getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {products.length === 0 ? (
          <div className="max-w-md mx-auto px-6 py-24 text-center text-sm text-ink-muted">
            Nothing in this drop yet — check back soon.
          </div>
        ) : (
          <HomeReveal products={products} />
        )}
      </main>

      <footer className="site-footer border-t border-border">
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-24 lg:py-6 text-xs text-ink-muted flex flex-wrap items-center justify-between gap-2">
          <span>
            All sales subject to our{" "}
            <Link href="/legal" className="underline hover:text-ink transition-colors duration-150">
              terms &amp; policy
            </Link>
            . Contact:{" "}
            <a href="mailto:merchnguys@gmail.com" className="underline hover:text-ink transition-colors duration-150">
              merchnguys@gmail.com
            </a>{" "}
            ·{" "}
            <a href="tel:+918668481084" className="underline hover:text-ink transition-colors duration-150">
              +91 86684 81084
            </a>
          </span>
          <Link href="/status" className="hover:text-ink transition-colors duration-150">
            Order status
          </Link>
        </div>
      </footer>
    </div>
  );
}

