"use client";

import { useEffect, useState } from "react";

export function AdminPaymentSettings() {
  const [upiId, setUpiId] = useState("");
  const [currentQr, setCurrentQr] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUpiId(data.upi_id ?? "");
          setCurrentQr(data.qr_image_url ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    const form = new FormData();
    if (upiId.trim()) form.set("upi_id", upiId.trim());
    if (qrFile) form.set("qr_image", qrFile);

    const res = await fetch("/api/admin/config", { method: "PATCH", body: form });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save payment settings.");
      return;
    }
    setSaved(true);
    setQrFile(null);
    if (data.qr_image_url) setCurrentQr(data.qr_image_url);
  }

  if (loading) return null;

  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-wide text-ink-soft mb-3">Payment settings</h2>
      <form onSubmit={handleSubmit} className="border border-line p-4 flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-ink-soft">UPI ID</label>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="border border-line px-3 py-2 bg-paper-raised mono-num"
            placeholder="yourname@bank"
          />
        </div>

        <div className="flex items-center gap-4">
          {currentQr && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, not worth next/image config here
            <img src={currentQr} alt="Current QR code" className="w-20 h-20 border border-line object-contain" />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-ink-soft">
              {currentQr ? "Replace QR code" : "Upload QR code"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
        </div>

        {error && <p style={{ color: "var(--warn)" }}>{error}</p>}
        {saved && <p style={{ color: "var(--ok)" }}>Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 border border-ink self-start disabled:opacity-50"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {saving ? "Saving…" : "Save payment settings"}
        </button>
      </form>
    </section>
  );
}
