"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { ProductOrderForm } from "@/components/ProductOrderForm";
import { BottomSheet } from "@/components/BottomSheet";

// Instagram-style horizontal scroll-snap gallery. Falls back to the
// single legacy image_url if a product has no gallery rows yet.
export function ProductGallery({ product, sizes }: { product: Product; sizes: string }) {
  const images = product.images.length > 0
    ? product.images
    : product.image_url
      ? [{ id: "legacy", url: product.image_url, sort_order: 0 }]
      : [];
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  }

  return (
    <div className="relative w-full h-full">
      <div
        onScroll={handleScroll}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        {images.map((img, i) => (
          <div key={img.id} className="relative h-full w-full flex-shrink-0 snap-center">
            <Image
              src={img.url}
              alt={product.name}
              fill
              sizes={sizes}
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((img, i) => (
            <span
              key={img.id}
              className="w-1.5 h-1.5 rounded-full transition-opacity duration-150"
              style={{
                background: "var(--paper, #fff)",
                opacity: i === active ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop: 50/50 split, image sticky, details independently scrollable */}
      <div className="hidden lg:grid lg:grid-cols-2">
        <div className="relative h-screen sticky top-0">
          <ProductGallery product={product} sizes="50vw" />
        </div>
        <div className="px-10 py-16 max-w-md mx-auto w-full">
          <h1 className="font-display font-medium text-4xl leading-tight mb-3">{product.name}</h1>
          <p className="mono-num text-lg text-ink-muted mb-4">{formatPrice(product.price_paise)}</p>
          {product.description && (
            <p className="text-sm text-ink-muted leading-relaxed mb-8 max-w-sm">{product.description}</p>
          )}
          <Suspense fallback={null}>
            <ProductOrderForm product={product} />
          </Suspense>
        </div>
      </div>

      {/* Mobile: IG-post image gallery, caption block below, bottom-sheet buy flow */}
      <div className="lg:hidden">
        <div className="relative aspect-[4/5] w-full">
          <ProductGallery product={product} sizes="100vw" />
        </div>
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="min-w-0">
              <p className="font-body font-medium text-base truncate">{product.name}</p>
              <p className="mono-num text-base text-ink-muted">{formatPrice(product.price_paise)}</p>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="px-5 py-2.5 rounded-md bg-accent text-accent-ink text-sm font-semibold hover:opacity-85 transition-opacity duration-150 shrink-0"
            >
              Shop
            </button>
          </div>
          {product.description && (
            <p className="text-sm text-ink-muted leading-relaxed">{product.description}</p>
          )}
        </div>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 className="font-display font-medium text-2xl mb-1">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-ink-muted leading-relaxed mb-6">{product.description}</p>
        )}
        <Suspense fallback={null}>
          <ProductOrderForm product={product} onAdded={() => setSheetOpen(false)} />
        </Suspense>
      </BottomSheet>
    </>
  );
}
