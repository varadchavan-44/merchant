"use client";

import { useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      setError(data.error ?? "Login failed.");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xs mx-auto px-6 py-24">
      <h1 className="font-display font-medium text-xl mb-6">Admin</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Shared admin password"
          className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
          autoFocus
        />
        {error && (
          <p className="text-sm" style={{ color: "var(--warn)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {loading ? "…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
