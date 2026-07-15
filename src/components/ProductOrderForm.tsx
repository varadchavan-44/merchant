"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/lib/types";
import { Gauge } from "@/components/Gauge";
import { formatPrice } from "@/lib/data";

export function ProductOrderForm({ product }: { product: Product }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? undefined;

  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [error, setError] = useState("");

  const selectedSize = product.sizes.find((s) => s.id === sizeId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSize) {
      setError("Pick a size.");
      return;
    }
    if (!name || !rollNo || !phone || !pickup) {
      setError("Fill in your name, roll number, phone, and pickup location.");
      return;
    }

    const draft = {
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize.id,
      sizeLabel: selectedSize.size_label,
      quantity: qty,
      unitPricePaise: product.price_paise,
      buyerName: name,
      rollNo,
      branch,
      year,
      phone,
      pickupLocation: pickup,
      refCode,
    };
    sessionStorage.setItem("order_draft", JSON.stringify(draft));
    router.push("/checkout");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Size</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSizeId(s.id)}
              className={`px-4 py-2 text-sm border transition-colors ${
                sizeId === s.id
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-line-strong"
              }`}
            >
              {s.size_label}
            </button>
          ))}
        </div>
        {selectedSize && (
          <div className="mt-4 max-w-xs">
            <Gauge
              count={selectedSize.commit_count}
              threshold={selectedSize.commit_threshold}
              status={selectedSize.status}
              label="commitments so far"
            />
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 border border-line hover:border-line-strong flex items-center justify-center"
          >
            −
          </button>
          <span className="mono-num w-6 text-center">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(5, q + 1))}
            className="w-8 h-8 border border-line hover:border-line-strong flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Your details</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          />
          <input
            placeholder="Roll number"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          />
          <input
            placeholder="Branch (optional)"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          />
          <input
            placeholder="Year (optional)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          />
          <input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          />
          <input
            placeholder="Pickup location (hostel / dept)"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-line">
        <span className="mono-num text-lg">
          {formatPrice(product.price_paise * qty)}
        </span>
        <button
          type="submit"
          className="px-6 py-2.5 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity"
        >
          Continue to payment
        </button>
      </div>
    </form>
  );
}
