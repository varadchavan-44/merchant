"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Product, UnitCustomization } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { addToCart, cartCount, getCart } from "@/lib/cart";

const EMPTY_UNIT: UnitCustomization = { name: "", number: "" };

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
  const [units, setUnits] = useState<UnitCustomization[]>([{ ...EMPTY_UNIT }]);
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

  function setQuantity(next: number) {
    const clamped = Math.max(1, Math.min(5, next));
    setQty(clamped);
    if (product.is_customizable) {
      setUnits((prev) => {
        if (prev.length === clamped) return prev;
        if (prev.length < clamped) {
          return [...prev, ...Array(clamped - prev.length).fill(null).map(() => ({ ...EMPTY_UNIT }))];
        }
        return prev.slice(0, clamped);
      });
    }
    setJustAdded(false);
  }

  function updateUnit(index: number, field: keyof UnitCustomization, value: string) {
    setUnits((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function handleAddToCart(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSize) {
      setError("Pick a size.");
      return;
    }

    let customizations: UnitCustomization[] | undefined;
    if (product.is_customizable) {
      const trimmed = units.slice(0, qty).map((u) => ({
        name: u.name.trim(),
        number: product.requires_number ? u.number.trim() : undefined,
      }));
      const missingName = trimmed.some((u) => !u.name);
      const missingNumber = product.requires_number && trimmed.some((u) => !u.number);
      if (missingName || missingNumber) {
        setError(
          product.requires_number
            ? "Enter a name and number for every shirt."
            : "Enter a name for every shirt."
        );
        return;
      }
      customizations = trimmed;
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize.id,
      sizeLabel: selectedSize.size_label,
      quantity: qty,
      unitPricePaise: product.price_paise,
      customizations,
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
            onClick={() => setQuantity(qty - 1)}
            className="w-8 h-8 rounded-md border border-border hover:border-ink transition-colors duration-150 flex items-center justify-center"
          >
            −
          </button>
          <span className="mono-num w-6 text-center">{qty}</span>
          <button
            type="button"
            onClick={() => setQuantity(qty + 1)}
            className="w-8 h-8 rounded-md border border-border hover:border-ink transition-colors duration-150 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {product.is_customizable && (
        <div>
          <p className="eyebrow mb-3">
            {product.requires_number ? "Name & number to print" : "Name to print"}
          </p>
          <div className="flex flex-col gap-3">
            {units.slice(0, qty).map((unit, i) => (
              <div key={i} className="flex items-center gap-2">
                {qty > 1 && <span className="text-xs text-ink-muted w-6 shrink-0">#{i + 1}</span>}
                <input
                  value={unit.name}
                  onChange={(e) => updateUnit(i, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-1 rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
                />
                {product.requires_number && (
                  <input
                    value={unit.number ?? ""}
                    onChange={(e) => updateUnit(i, "number", e.target.value)}
                    placeholder="Number"
                    inputMode="numeric"
                    className="w-24 rounded-md border border-border px-3 py-2 text-sm bg-bg-raised mono-num focus:outline-none focus:border-ink transition-colors duration-150"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="mono-num text-lg">{formatPrice(product.price_paise * qty)}</span>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-md bg-accent text-accent-ink text-sm font-semibold hover:opacity-85 transition-opacity duration-150"
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
