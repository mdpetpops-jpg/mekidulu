import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

const base = site.url.replace(/\/$/, "");

/**
 * AI crawlers are explicitly allowed: for a B2B manufacturer, being quoted by
 * ChatGPT / Perplexity / Claude when a buyer asks "who makes heavy-duty wood
 * cat trees" is worth as much as a blue link.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/unsubscribe"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/unsubscribe"],
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
