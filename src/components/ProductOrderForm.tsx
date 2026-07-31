"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { addToCart, cartCount, getCart } from "@/lib/cart";

export function ProductOrderForm({
  product,
  onAdded,
}: {
  product: Product;
  onAdded?: () => void;
}) {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? undefined;

  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [count, setCount] = useState(0);

  const selectedSize = product.sizes.find((s) => s.id === sizeId);

  useEffect(() => {
    // Referral code sticks for the whole session, not just this product.
    if (refCode) sessionStorage.setItem("ref_code", refCode);
  }, [refCode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only store on mount, not derived state
    setCount(cartCount(getCart()));
  }, []);

  function handleAddToCart(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSize) {
      setError("Pick a size.");
      return;
    }
    addToCart({
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize.id,
      sizeLabel: selectedSize.size_label,
      quantity: qty,
      unitPricePaise: product.price_paise,
    });
    setError("");
    setJustAdded(true);
    setCount(cartCount(getCart()));
    onAdded?.();
  }

  return (
    <form onSubmit={handleAddToCart} className="flex flex-col gap-8">
      <div>
        <p className="eyebrow mb-3">Size</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => {
                setSizeId(s.id);
                setJustAdded(false);
              }}
              className={`px-4 py-2 text-sm rounded-md border transition-colors duration-150 ${
                sizeId === s.id
                  ? "border-ink bg-ink text-on-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              {s.size_label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setQty((q) => Math.max(1, q - 1));
              setJustAdded(false);
            }}
            className="w-8 h-8 rounded-md border border-border hover:border-ink transition-colors duration-150 flex items-center justify-center"
          >
            −
          </button>
          <span className="mono-num w-6 text-center">{qty}</span>
          <button
            type="button"
            onClick={() => {
              setQty((q) => Math.min(5, q + 1));
              setJustAdded(false);
            }}
            className="w-8 h-8 rounded-md border border-border hover:border-ink transition-colors duration-150 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="mono-num text-lg">{formatPrice(product.price_paise * qty)}</span>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-md bg-ink text-on-ink text-sm font-medium hover:opacity-85 transition-opacity duration-150"
        >
          Add to cart
        </button>
      </div>

      {justAdded && (
        <p className="text-sm text-center text-ink-muted">
          Added to cart.{" "}
          <Link href="/cart" className="underline font-medium text-ink">
            View cart ({count})
          </Link>
        </p>
      )}
    </form>
  );
}
