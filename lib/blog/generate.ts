import { runAi } from "@/lib/ai";
import { findTopic, type TopicSource } from "@/lib/blog/sources";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type GenerateResult =
  | { ok: true; id: string; slug: string; title: string; source: TopicSource; question: string; tokens: number; attempts: unknown }
  | { ok: false; error: string; source?: TopicSource };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);
}

function parseOutput(raw: string, fallbackTitle: string) {
  const titleMatch = raw.match(/^\s*TITLE\s*:\s*(.+)$/m);
  const summaryMatch = raw.match(/^\s*SUMMARY\s*:\s*(.+)$/m);
  const body = raw
    .replace(/^\s*TITLE\s*:.*$/gm, "")
    .replace(/^\s*SUMMARY\s*:.*$/gm, "")
    .replace(/^\s*---\s*$/m, "")
    .trim();

  return {
    title: (titleMatch?.[1] ?? fallbackTitle).replace(/^["']|["']$/g, "").slice(0, 180),
    summary: (summaryMatch?.[1] ?? "").slice(0, 300),
    body: body || raw,
  };
}

/**
 * One draft, start to finish: pick a topic (rss → trends → fallback), generate
 * with the de-AI prompt, store as `draft`.
 *
 * Shared by the 12:00 UTC cron and the "generate now" button in /admin/blog, so
 * both paths behave identically and both are logged to `ai_logs`.
 */
export async function generateBlogDraft(): Promise<GenerateResult> {
  const supabase = getSupabaseAdmin();
  const topic = await findTopic();

  // Same headline twice must not collide with the unique slug.
  const { data: existing } = await supabase.from("blog_posts").select("slug");
  const usedSlugs = new Set((existing ?? []).map((row) => (row as { slug: string }).slug));
  const base = slugify(topic.title) || "cat-furniture-note";
  let slug = base;
  for (let suffix = 2; usedSlugs.has(slug); suffix += 1) {
    slug = `${base}-${suffix}`.slice(0, 78);
  }

  const input = `[source=${topic.source}]
Reader question: ${topic.title}
Context: ${topic.excerpt || "(no body)"}

Return exactly in this format:
TITLE: <under 65 characters>
SUMMARY: <one sentence, under 160 characters>
---
<300-word article in plain Markdown>`;

  // 400 tokens ≈ 300 words; anything longer is the model ignoring the brief.
  const result = await runAi({ scenario: "blog_generation", input, maxTokens: 400, temperature: 0.85 });
  if (!result.ok || !result.text) {
    return { ok: false, error: result.error ?? "AI failed", source: topic.source };
  }

  const parsed = parseOutput(result.text, topic.title);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: parsed.title,
      content: parsed.summary ? `> ${parsed.summary}\n\n${parsed.body}` : parsed.body,
      cover_image: "/images/journal-8782.webp",
      status: "draft",
    })
    .select("id, slug, title")
    .single();

  if (error) {
    return { ok: false, error: error.message, source: topic.source };
  }

  return {
    ok: true,
    id: (data as { id: string }).id,
    slug: (data as { slug: string }).slug,
    title: (data as { title: string }).title,
    source: topic.source,
    question: topic.title,
    tokens: result.tokens,
    attempts: topic.attempts,
  };
}
