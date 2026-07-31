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
        <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-10">
          {products.map((p, i) => (
            <span key={p.id} className="mono-num text-xs" style={{ color: i === activeIndex ? "var(--ink)" : "var(--ink-muted)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
        </div>
      )}

      {products.map((product, index) => {
        const imageLeft = index % 2 === 0;
        return (
          <section
            key={product.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className={`reveal ${visible[index] ? "reveal-in" : ""} min-h-[90vh] lg:flex lg:items-stretch border-b border-border last:border-b-0`}
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
            </div>

            <div
              className={`hidden lg:flex lg:w-1/2 items-center ${imageLeft ? "lg:order-2" : "lg:order-1"}`}
            >
              <div className="max-w-md mx-auto px-10 py-16 w-full">
                <h2 className="font-display font-medium text-4xl leading-tight mb-3">{product.name}</h2>
                <p className="mono-num text-lg text-ink-muted mb-4">{formatPrice(product.price_paise)}</p>
                {product.description && (
                  <p className="text-sm text-ink-muted leading-relaxed mb-8 max-w-sm">{product.description}</p>
                )}
                <Suspense fallback={null}>
                  <ProductOrderForm product={product} />
                </Suspense>
              </div>
            </div>

            {/* Mobile: full-bleed image is the section, bottom bar pinned to it */}
            <div className="lg:hidden relative h-[92vh]">
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              )}
              <div className="sticky bottom-0 left-0 right-0 bg-bg-raised border-t border-border px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-body font-medium text-sm">{product.name}</p>
                  <p className="mono-num text-sm text-ink-muted">{formatPrice(product.price_paise)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetProductId(product.id)}
                  className="px-5 py-2.5 rounded-md bg-ink text-on-ink text-sm font-medium hover:opacity-85 transition-opacity duration-150"
                >
                  Shop
                </button>
              </div>
            </div>
          </section>
        );
      })}

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
