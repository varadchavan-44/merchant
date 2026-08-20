import "./preview.css";

/*
  PREVIEW — Grok's audit implemented as scoped CSS on top of the real
  site. No new components, no edits to any existing file.

  How it works: SiteHeader / HomeReveal / ProductDetail already read
  color from CSS custom properties (--bg, --ink-muted, --accent, etc.)
  defined at :root in globals.css. Wrapping them in .pv-root here and
  redeclaring those same variable names inside preview.css overrides
  the values for everything under this route only — the live site
  outside /preview is untouched. A handful of Tailwind utility
  combinations (spacing, weight) get similarly scoped overrides for
  the density/hierarchy notes that aren't purely color.
*/
export default function PreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="pv-root">{children}</div>;
}
