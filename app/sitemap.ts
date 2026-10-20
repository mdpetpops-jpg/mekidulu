import type { MetadataRoute } from "next";

import { getPostMeta } from "@/lib/journal";
import { manualFiles, manualPdfPath } from "@/lib/manuals";
import { products, site } from "@/lib/site";

/**
 * Sitemap for crawlers. Blog entries come from the Markdown files themselves,
 * so publishing a new article updates the sitemap automatically — nothing to
 * maintain by hand.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/wholesale`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/manuals`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const posts: MetadataRoute.Sitemap = getPostMeta().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  // Product pages do not exist individually yet; the line card is on the
  // homepage and the full range on /shop.
  const productsWithPages: MetadataRoute.Sitemap = products
    .filter(() => false)
    .map((product) => ({
      url: `${base}/shop/${product.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  // Assembly PDFs are useful, indexable resources and rank for model numbers.
  const manuals: MetadataRoute.Sitemap = manualFiles.map((manual) => ({
    url: `${base}${manualPdfPath(manual.id)}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...posts, ...productsWithPages, ...manuals];
}
