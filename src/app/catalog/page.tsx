import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Gauge } from "@/components/Gauge";
import { getProducts, getDropConfig, formatPrice } from "@/lib/data";
import { Countdown } from "@/components/Countdown";
import Image from "next/image";

export default async function CatalogPage() {
  const [products, config] = await Promise.all([getProducts(), getDropConfig()]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="flex items-baseline justify-between mb-10 flex-wrap gap-3">
          <h1 className="font-display font-medium text-2xl">Catalog</h1>
          <Countdown cutoff={config.cutoff_at} extended={config.extended} />
        </div>

        <div className="flex flex-col gap-px bg-line">
          {products.map((p) => (
            <div key={p.id} className="bg-paper p-6 md:p-8 grid md:grid-cols-[220px_1fr] gap-6">
              <Link href={`/product/${p.id}`} className="block">
                <div className="relative aspect-[4/5] bg-paper-raised border border-line overflow-hidden">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(min-width: 768px) 220px, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </Link>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <Link href={`/product/${p.id}`}>
                    <h2 className="font-display font-medium text-lg hover:opacity-70 transition-opacity">
                      {p.name}
                    </h2>
                  </Link>
                  <span className="mono-num text-sm text-ink-soft">{formatPrice(p.price_paise)}</span>
                </div>
                <p className="text-sm text-ink-soft mb-5 max-w-md leading-relaxed">{p.description}</p>

                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {p.sizes.map((s) => (
                    <Gauge
                      key={s.id}
                      count={s.commit_count}
                      threshold={s.commit_threshold}
                      status={s.status}
                      label={`size ${s.size_label}`}
                    />
                  ))}
                </div>

                <Link
                  href={`/product/${p.id}`}
                  className="inline-block mt-6 text-sm font-medium border-b border-ink pb-0.5 hover:opacity-70 transition-opacity"
                >
                  Commit to this design &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}