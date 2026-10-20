/**
 * Legacy URLs from the GitHub Pages site.
 *
 * The old journal was query-routed (`/blog.html?id=blog-…`), not path-routed,
 * so each article gets an exact 301 below. `/journal/*` never existed on the
 * old site but is kept as a safety net for links that were shared as
 * "/journal/…".
 */
const legacyJournal = [
  ["blog-carpet-cleaning-nightmare", "carpet-cleaning-nightmare"],
  ["blog-scratch-furniture-harmony", "scratch-furniture-harmony"],
  ["blog-8782-qa", "8782-qa"],
  ["blog-easy-clean", "easy-clean"],
  ["blog-space-harmony", "space-harmony"],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Escape hatch for sandboxes/CI that block child_process spawning (Next runs
  // its type check in a subprocess). Type checking stays ON by default — Vercel
  // and local builds behave normally. When skipping here, run `pnpm typecheck`.
  typescript:
    process.env.SKIP_TYPECHECK === "1" ? { ignoreBuildErrors: true } : undefined,

  async redirects() {
    return [
      // Exact legacy article URLs (query string, so `has` is required).
      ...legacyJournal.map(([id, slug]) => ({
        source: "/blog.html",
        has: [{ type: "query", key: "id", value: id }],
        destination: `/blog/${slug}`,
        permanent: true,
      })),
      // Legacy journal index and flat static pages.
      { source: "/blog.html", destination: "/blog", permanent: true },
      { source: "/journal", destination: "/blog", permanent: true },
      { source: "/journal/:slug*", destination: "/blog/:slug*", permanent: true },
      { source: "/products.html", destination: "/shop", permanent: true },
      { source: "/catalog.html", destination: "/catalog", permanent: true },
      { source: "/manuals.html", destination: "/manuals", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};

module.exports = nextConfig;
