import { listPublishedPosts } from "@/lib/blog";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * RSS 2.0 feed. Cheap distribution for aggregators and a second discovery
 * channel next to the sitemap.
 */
export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const posts = (await listPublishedPosts()).slice(0, 30);

  const items = posts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${base}/blog/${post.slug}</link>
      <guid isPermaLink="true">${base}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      <category>${post.category}</category>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mekidulu Journal</title>
    <link>${base}/blog</link>
    <description>Engineering notes on heavy-duty cat furniture: stability, hygiene and feline behaviour.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
