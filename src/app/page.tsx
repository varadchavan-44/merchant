import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { Countdown } from "@/components/Countdown";
import { Gauge } from "@/components/Gauge";
import { getProducts, getDropConfig, totalCommits, formatPrice } from "@/lib/data";
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [products, config] = await Promise.all([getProducts(), getDropConfig()]);
  const total = totalCommits(products);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-14">
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-4">VNIT, this term only</p>
          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.08] max-w-2xl">
            Nothing gets printed until enough people commit to it.
          </h1>
          <p className="mt-5 text-ink-soft max-w-lg leading-relaxed">
            Pick a size, commit to buying it, pay by UPI. Once a size hits its
            threshold, it goes to print. If it doesn&apos;t, you get refunded — no
            guessing on stock, no dead inventory.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/catalog"
              className="inline-flex items-center px-5 py-2.5 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity"
            >
              View the catalog
            </Link>
            <Countdown cutoff={config.cutoff_at} extended={config.extended} />
          </div>

          <div className="mt-10 pt-6 border-t border-line flex items-baseline gap-2">
            <span className="mono-num text-2xl" style={{ color: "var(--signal)" }}>
              {total}
            </span>
            <span className="text-sm text-ink-soft">units committed to across all designs so far</span>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display font-medium text-xl">This drop</h2>
            <Link href="/catalog" className="text-sm text-ink-soft hover:text-ink transition-colors">
              See all &rarr;
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
            {products.map((p) => {
              const closest = [...p.sizes].sort(
                (a, b) => b.commit_count / b.commit_threshold - a.commit_count / a.commit_threshold
              )[0];
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="bg-paper hover:bg-paper-raised transition-colors p-6 flex flex-col gap-4"
                >
                  <div className="relative aspect-[4/5] bg-paper-raised border border-line overflow-hidden">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display font-medium">{p.name}</h3>
                      <span className="mono-num text-sm text-ink-soft">
                        {formatPrice(p.price_paise)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-soft mt-1 leading-relaxed">{p.description}</p>
                  </div>
                  {closest && (
                    <Gauge
                      count={closest.commit_count}
                      threshold={closest.commit_threshold}
                      status={closest.status}
                      label={`closest to print — size ${closest.size_label}`}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-ink-soft flex justify-between">
          <span>VNIT Nagpur — student-run, not affiliated with the institute administration.</span>
          <Link href="/status" className="hover:text-ink transition-colors">
            Track an order
          </Link>
        </div>
      </footer>
    </div>
  );
}