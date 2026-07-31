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

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-ink-muted flex justify-between">
          <span>VNIT Nagpur — student-run, not affiliated with the institute administration.</span>
          <Link href="/status" className="hover:text-ink transition-colors duration-150">
            Order status
          </Link>
        </div>
      </footer>
    </div>
  );
}
