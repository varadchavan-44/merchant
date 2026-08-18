"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { ProductOrderForm } from "@/components/ProductOrderForm";
import { BottomSheet } from "@/components/BottomSheet";

export function ProductDetail({ product }: { product: Product }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop: 50/50 split, image sticky, details independently scrollable */}
      <div className="hidden lg:grid lg:grid-cols-2">
        <div className="relative h-screen sticky top-0">
          {product.image_url && (
            <Image src={product.image_url} alt={product.name} fill sizes="50vw" className="object-cover" priority />
          )}
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

      {/* Mobile: full-bleed image, fixed bottom bar, bottom-sheet buy flow */}
      <div className="lg:hidden relative aspect-[4/5] w-full">
        {product.image_url && (
          <Image src={product.image_url} alt={product.name} fill sizes="100vw" className="object-cover" priority />
        )}
        <div className="sticky bottom-0 left-0 right-0 bg-bg-raised border-t border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-body font-medium text-base">{product.name}</p>
            <p className="mono-num text-base text-ink-muted">{formatPrice(product.price_paise)}</p>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="px-5 py-2.5 rounded-md bg-accent text-accent-ink text-sm font-semibold hover:opacity-85 transition-opacity duration-150"
          >
            Shop
          </button>
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
