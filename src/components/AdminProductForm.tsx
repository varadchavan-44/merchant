"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/data";

interface SizeRow {
  size_label: string;
  commit_threshold: string; // kept as string while editing, parsed on submit
}

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_paise: number;
  active: boolean;
  sizes: { id: string; size_label: string; commit_threshold: number; commit_count: number; status: string }[];
}

const EMPTY_SIZE_ROW: SizeRow = { size_label: "", commit_threshold: "" };

export function AdminProductForm() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([{ ...EMPTY_SIZE_ROW }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (res.ok) setProducts(data.products);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag around a data fetch
    setLoading(true);
    loadProducts().finally(() => setLoading(false));
  }, [loadProducts]);

  function updateSizeRow(index: number, field: keyof SizeRow, value: string) {
    setSizeRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addSizeRow() {
    setSizeRows((rows) => [...rows, { ...EMPTY_SIZE_ROW }]);
  }

  function removeSizeRow(index: number) {
    setSizeRows((rows) => rows.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPriceRupees("");
    setSizeRows([{ ...EMPTY_SIZE_ROW }]);
    setImageFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedRows = sizeRows
      .map((r) => ({ size_label: r.size_label.trim(), commit_threshold: r.commit_threshold }))
      .filter((r) => r.size_label);

    if (!name.trim()) return setError("Product name is required.");
    if (!priceRupees || !Number.isFinite(Number(priceRupees)) || Number(priceRupees) <= 0) {
      return setError("Enter a valid price in rupees.");
    }
    if (trimmedRows.length === 0) return setError("Add at least one size.");
    for (const r of trimmedRows) {
      if (!Number.isFinite(Number(r.commit_threshold)) || Number(r.commit_threshold) <= 0) {
        return setError(`Size "${r.size_label}" needs a commit threshold greater than 0.`);
      }
    }

    setSubmitting(true);
    const form = new FormData();
    form.set("name", name.trim());
    form.set("description", description.trim());
    form.set("price_paise", String(Math.round(Number(priceRupees) * 100)));
    form.set(
      "sizes",
      JSON.stringify(trimmedRows.map((r) => ({ size_label: r.size_label, commit_threshold: Number(r.commit_threshold) })))
    );
    if (imageFile) form.set("image", imageFile);

    const res = await fetch("/api/admin/products", { method: "POST", body: form });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create product.");
      return;
    }

    resetForm();
    setShowForm(false);
    loadProducts();
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft">Products</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1 border border-line hover:border-ink transition-colors text-sm"
        >
          {showForm ? "Cancel" : "Add product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-line p-4 mb-4 flex flex-col gap-4 text-sm">
          {error && <p style={{ color: "var(--warn)" }}>{error}</p>}

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-ink-soft">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-line px-3 py-2 bg-paper-raised"
              placeholder="Field Jacket"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-ink-soft">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-line px-3 py-2 bg-paper-raised"
              rows={2}
              placeholder="Heavyweight cotton, embroidered crest…"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-ink-soft">Price (₹)</label>
            <input
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              inputMode="decimal"
              className="border border-line px-3 py-2 bg-paper-raised mono-num"
              placeholder="1299"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-soft">Sizes and commit thresholds</label>
            {sizeRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.size_label}
                  onChange={(e) => updateSizeRow(i, "size_label", e.target.value)}
                  className="border border-line px-3 py-2 bg-paper-raised w-20"
                  placeholder="M"
                />
                <input
                  value={row.commit_threshold}
                  onChange={(e) => updateSizeRow(i, "commit_threshold", e.target.value)}
                  inputMode="numeric"
                  className="border border-line px-3 py-2 bg-paper-raised w-28 mono-num"
                  placeholder="threshold"
                />
                {sizeRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSizeRow(i)}
                    className="text-xs text-ink-soft hover:text-ink"
                  >
                    remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSizeRow}
              className="text-xs text-left underline w-fit"
              style={{ color: "var(--signal)" }}
            >
              + add another size
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-ink-soft">Product photo (JPG/PNG)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-ink self-start disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {submitting ? "Saving…" : "Save product"}
          </button>
        </form>
      )}

      <div className="border border-line divide-y divide-line">
        {loading && <p className="px-4 py-3 text-sm text-ink-soft">Loading…</p>}
        {!loading && products.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink-soft">No products yet — add your first one above.</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3 text-sm">
            <div className="w-14 h-14 border border-line flex-shrink-0 overflow-hidden bg-paper-raised">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, not worth next/image config here
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span>{p.name}</span>
                <span className="mono-num text-ink-soft">{formatPrice(p.price_paise)}</span>
              </div>
              <div className="text-xs text-ink-soft mt-1">
                {p.sizes.map((s) => `${s.size_label} (${s.commit_count}/${s.commit_threshold})`).join(", ") ||
                  "no sizes yet"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
