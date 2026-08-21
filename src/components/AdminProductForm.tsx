"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/data";
import { compressImage } from "@/lib/image-compression";

interface SizeRow {
  id?: string; // present for existing sizes, absent for newly added rows
  size_label: string;
  commit_threshold: string; // kept as string while editing, parsed on submit
}

interface AdminProductImage {
  id: string;
  url: string;
  sort_order: number;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_paise: number;
  active: boolean;
  is_customizable: boolean;
  requires_number: boolean;
  images: AdminProductImage[];
  sizes: { id: string; size_label: string; commit_threshold: number; commit_count: number; status: string }[];
}

const MAX_IMAGES = 6;

const EMPTY_SIZE_ROW: SizeRow = { size_label: "", commit_threshold: "" };
const EMPTY_FORM = {
  name: "",
  description: "",
  priceRupees: "",
  sizeRows: [{ ...EMPTY_SIZE_ROW }] as SizeRow[],
};

export function AdminProductForm() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // mode: null = form hidden, "new" = adding, otherwise the id of the product being edited
  const [mode, setMode] = useState<"new" | string | null>(null);

  const [name, setName] = useState(EMPTY_FORM.name);
  const [description, setDescription] = useState(EMPTY_FORM.description);
  const [priceRupees, setPriceRupees] = useState(EMPTY_FORM.priceRupees);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(EMPTY_FORM.sizeRows);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [requiresNumber, setRequiresNumber] = useState(true);
  const [existingImages, setExistingImages] = useState<AdminProductImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [compressingImages, setCompressingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rowNotice, setRowNotice] = useState<Record<string, string>>({});

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

  function updateSizeRow(index: number, field: "size_label" | "commit_threshold", value: string) {
    setSizeRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addSizeRow() {
    setSizeRows((rows) => [...rows, { ...EMPTY_SIZE_ROW }]);
  }

  function removeSizeRow(index: number) {
    setSizeRows((rows) => rows.filter((_, i) => i !== index));
  }

  const imageSlotsLeft = MAX_IMAGES - existingImages.length - newImageFiles.length;

  async function handleNewImagesSelected(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, Math.max(0, imageSlotsLeft));
    if (incoming.length === 0) return;
    setCompressingImages(true);
    try {
      const compressed = await Promise.all(incoming.map(compressImage));
      setNewImageFiles((prev) => [...prev, ...compressed]);
    } finally {
      setCompressingImages(false);
    }
  }

  function removeExistingImage(id: string) {
    setExistingImages((imgs) => imgs.filter((i) => i.id !== id));
  }

  function removeNewImage(index: number) {
    setNewImageFiles((files) => files.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName(EMPTY_FORM.name);
    setDescription(EMPTY_FORM.description);
    setPriceRupees(EMPTY_FORM.priceRupees);
    setSizeRows([{ ...EMPTY_SIZE_ROW }]);
    setIsCustomizable(false);
    setRequiresNumber(true);
    setExistingImages([]);
    setNewImageFiles([]);
    setError("");
  }

  function openNewForm() {
    resetForm();
    setMode("new");
  }

  function openEditForm(p: AdminProduct) {
    setName(p.name);
    setDescription(p.description ?? "");
    setPriceRupees(String(p.price_paise / 100));
    setSizeRows(
      p.sizes.length > 0
        ? p.sizes.map((s) => ({ id: s.id, size_label: s.size_label, commit_threshold: String(s.commit_threshold) }))
        : [{ ...EMPTY_SIZE_ROW }]
    );
    setIsCustomizable(p.is_customizable);
    setRequiresNumber(p.requires_number);
    setExistingImages([...p.images].sort((a, b) => a.sort_order - b.sort_order));
    setNewImageFiles([]);
    setError("");
    setMode(p.id);
  }

  function closeForm() {
    setMode(null);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedRows = sizeRows
      .map((r) => ({ id: r.id, size_label: r.size_label.trim(), commit_threshold: r.commit_threshold }))
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
    form.set("is_customizable", String(isCustomizable));
    form.set("requires_number", String(requiresNumber));
    form.set(
      "sizes",
      JSON.stringify(
        trimmedRows.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          size_label: r.size_label,
          commit_threshold: Number(r.commit_threshold),
        }))
      )
    );
    for (const file of newImageFiles) form.append("images", file);

    const isEditing = mode !== "new" && mode !== null;
    if (isEditing) {
      form.set("keep_image_ids", JSON.stringify(existingImages.map((i) => i.id)));
    }

    const url = isEditing ? `/api/admin/products/${mode}` : "/api/admin/products";
    const method = isEditing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, { method, body: form });
      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(data.error ?? "Could not save product.");
        return;
      }

      if (data.warnings?.length) {
        setRowNotice((n) => ({ ...n, [mode as string]: data.warnings.join(" ") }));
      }

      closeForm();
      loadProducts();
    } catch {
      setSubmitting(false);
      setError("Save failed or timed out — check your connection and try again with fewer/smaller photos.");
    }
  }

  async function handleDelete(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"? This can't be undone unless it has existing orders, in which case it'll be archived instead.`)) {
      return;
    }
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not delete product.");
      return;
    }
    if (data.archived) {
      alert(data.message);
    }
    loadProducts();
  }

  async function handleToggleActive(p: AdminProduct) {
    const form = new FormData();
    form.set("name", p.name);
    form.set("description", p.description ?? "");
    form.set("price_paise", String(p.price_paise));
    form.set("active", String(!p.active));
    form.set("sizes", JSON.stringify(p.sizes.map((s) => ({ id: s.id, size_label: s.size_label, commit_threshold: s.commit_threshold }))));
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "PATCH", body: form });
    if (res.ok) loadProducts();
  }

  const formOpen = mode !== null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wide text-ink-soft">Products</h2>
        <button
          onClick={() => (formOpen ? closeForm() : openNewForm())}
          className="px-3 py-1 border border-line hover:border-ink transition-colors text-sm"
        >
          {formOpen ? "Cancel" : "Add product"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="border border-line p-4 mb-4 flex flex-col gap-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            {mode === "new" ? "New product" : "Editing product"}
          </p>
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

          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-soft">
            <input
              type="checkbox"
              checked={isCustomizable}
              onChange={(e) => setIsCustomizable(e.target.checked)}
            />
            Customizable — buyer enters a name &amp; number to print
          </label>

          {isCustomizable && (
            <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-soft pl-5">
              <input
                type="checkbox"
                checked={requiresNumber}
                onChange={(e) => setRequiresNumber(e.target.checked)}
              />
              Also require a number (uncheck for name-only designs)
            </label>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-soft">Sizes and commit thresholds</label>
            {sizeRows.map((row, i) => (
              <div key={row.id ?? i} className="flex items-center gap-2">
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
            <p className="text-xs text-ink-soft">
              Removing a size that already has orders against it won&apos;t delete it — you&apos;ll get a note after saving.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-soft">
              Photos (up to {MAX_IMAGES}) — first one shown as the thumbnail, rest scroll like an Instagram post
            </label>
            {(existingImages.length > 0 || newImageFiles.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative w-16 h-16 border border-line overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-0 right-0 w-5 h-5 text-xs flex items-center justify-center"
                      style={{ background: "var(--paper)", color: "var(--warn)" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newImageFiles.map((file, i) => (
                  <div key={i} className="relative w-16 h-16 border border-line overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail */}
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-0 right-0 w-5 h-5 text-xs flex items-center justify-center"
                      style={{ background: "var(--paper)", color: "var(--warn)" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageSlotsLeft > 0 ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={compressingImages}
                  onChange={(e) => {
                    handleNewImagesSelected(e.target.files);
                    e.target.value = "";
                  }}
                  className="text-sm disabled:opacity-50"
                />
                {compressingImages && <p className="text-xs text-ink-soft">Compressing photos…</p>}
              </>
            ) : (
              <p className="text-xs text-ink-soft">Max {MAX_IMAGES} images reached — remove one to add another.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || compressingImages}
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
          <div key={p.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
            <div className="flex items-center gap-4">
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
                  {p.is_customizable && (
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--signal)" }}>
                      customizable
                    </span>
                  )}
                  {!p.active && (
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--warn)" }}>
                      archived
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-soft mt-1">
                  {p.sizes.map((s) => `${s.size_label} (${s.commit_count}/${s.commit_threshold})`).join(", ") ||
                    "no sizes yet"}
                  {p.images.length > 0 ? ` · ${p.images.length} photo${p.images.length > 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={() => openEditForm(p)} className="underline hover:no-underline">
                  Edit
                </button>
                <button onClick={() => handleToggleActive(p)} className="underline hover:no-underline">
                  {p.active ? "Archive" : "Unarchive"}
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="underline hover:no-underline"
                  style={{ color: "var(--warn)" }}
                >
                  Delete
                </button>
              </div>
            </div>
            {rowNotice[p.id] && <p className="text-xs text-ink-soft">{rowNotice[p.id]}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
