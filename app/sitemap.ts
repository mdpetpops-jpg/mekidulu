import type { MetadataRoute } from "next";

import { listPublishedPosts } from "@/lib/blog";
import { manualFiles, manualPdfPath } from "@/lib/manuals";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Sitemap for crawlers. Blog entries come from the database (published posts)
 * plus the legacy Markdown files, so publishing from /admin updates this
 * automatically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const posts: MetadataRoute.Sitemap = (await listPublishedPosts()).map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const manuals: MetadataRoute.Sitemap = manualFiles.map((manual) => ({
    url: `${base}${manualPdfPath(manual.id)}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...posts, ...manuals];
}
