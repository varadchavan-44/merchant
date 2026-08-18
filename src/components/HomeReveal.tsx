"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { ProductOrderForm } from "@/components/ProductOrderForm";
import { BottomSheet } from "@/components/BottomSheet";

export function HomeReveal({ products }: { products: Product[] }) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(() => products.map(() => false));
  const [activeIndex, setActiveIndex] = useState(0);
  const [sheetProductId, setSheetProductId] = useState<string | null>(null);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) {
            setVisible((prev) => {
              if (prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) {
        revealObserver.observe(el);
        activeObserver.observe(el);
      }
    });

    return () => {
      revealObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [products.length]);

  const sheetProduct = products.find((p) => p.id === sheetProductId) ?? null;

  return (
    <>
      {products.length > 1 && (
        <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-20" aria-label="Products in this drop">
          {products.map((p, i) => (
            <span
              key={p.id}
              className="mono-num text-xs transition-colors duration-300"
              style={{ color: i === activeIndex ? "var(--ink)" : "var(--ink-muted)" }}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
        </div>
      )}

      {products.map((product, index) => {
        const imageLeft = index % 2 === 0;
        const itemNumber = String(index + 1).padStart(2, "0");
        return (
          <section
            key={product.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className={`reveal snap-section ${visible[index] ? "reveal-in" : ""} min-h-screen lg:flex lg:items-stretch border-b border-border last:border-b-0`}
          >
            <div className={`hidden lg:block lg:w-1/2 relative ${imageLeft ? "lg:order-1" : "lg:order-2"}`}>
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              )}
              <div className="photo-scrim-top" aria-hidden="true" />
              <div className="absolute inset-x-0 top-0 flex items-start justify-end p-8 text-on-photo">
                <span className="mono-num text-xs">{itemNumber} — {String(products.length).padStart(2, "0")}</span>
              </div>
            </div>

            <div
              className={`hidden lg:flex lg:w-1/2 items-center ${imageLeft ? "lg:order-2" : "lg:order-1"}`}
            >
              <div className="max-w-md mx-auto px-10 py-16 w-full">
                <p className="eyebrow mb-8">Object {itemNumber} / The VNIT drop</p>
                <h2 className="font-display font-medium text-4xl leading-tight mb-6">{product.name}</h2>
                <div className="flex items-baseline justify-between gap-4 border-y border-border py-4 mb-6">
                  <p className="mono-num text-lg">{formatPrice(product.price_paise)}</p>
                  <p className="eyebrow text-right">Limited campus issue</p>
                </div>
                {product.description && (
                  <p className="text-sm text-ink-muted leading-relaxed mb-8 max-w-sm">{product.description}</p>
                )}
                <Suspense fallback={null}>
                  <ProductOrderForm product={product} />
                </Suspense>
              </div>
            </div>

            {/* Mobile keeps the drop immersive; buying details stay one deliberate tap away. */}
            {/* Mobile: IG-post image, caption block below, one deliberate tap to buy. */}
            <div className="lg:hidden bg-bg-raised">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-body font-medium text-base mb-1 truncate">{product.name}</p>
                    <p className="mono-num text-base text-ink-muted">{formatPrice(product.price_paise)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetProductId(product.id)}
                    className="px-6 py-3 rounded-full bg-accent text-accent-ink text-sm font-semibold hover:opacity-85 transition-opacity duration-150 shrink-0"
                  >
                    Claim yours
                  </button>
                </div>
                {product.description && (
                  <p className="text-sm leading-relaxed text-ink-muted mt-3 max-w-[32ch]">{product.description}</p>
                )}
              </div>
            </div>

      <BottomSheet open={sheetProduct !== null} onClose={() => setSheetProductId(null)}>
        {sheetProduct && (
          <div>
            <h2 className="font-display font-medium text-2xl mb-1">{sheetProduct.name}</h2>
            {sheetProduct.description && (
              <p className="text-sm text-ink-muted leading-relaxed mb-6">{sheetProduct.description}</p>
            )}
            <Suspense fallback={null}>
              <ProductOrderForm product={sheetProduct} onAdded={() => setSheetProductId(null)} />
            </Suspense>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
