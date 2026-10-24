import { runAi } from "@/lib/ai";
import { referencesMarkdown } from "@/lib/blog/references";
import { findTopic, type TopicSource } from "@/lib/blog/sources";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type Audience = "C" | "B";

/**
 * C (even UTC day) → consumer traffic: Reddit r/CatAdvice, first-person voice,
 *   plus a wholesale banner at the end of every article.
 * B (odd UTC day)  → buyer conversion: r/smallbusiness + r/ecommerce, supply
 *   chain voice, commercial pain points.
 */
export function audienceForDate(date: Date = new Date()): Audience {
  return date.getUTCDate() % 2 === 0 ? "C" : "B";
}

export const B2B_BANNER =
  '<div class="b2b-banner"><h3>Are you a pet store owner?</h3><p>Get wholesale pricing on our heavy-duty cat trees.</p><a href="/wholesale">Get a Quote</a></div>';

export type GenerateResult =
  | {
      ok: true;
      id: string;
      slug: string;
      title: string;
      audience: Audience;
      source: TopicSource;
      question: string;
      tokens: number;
      attempts: unknown;
    }
  | { ok: false; error: string; source?: TopicSource; audience?: Audience };

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

async function uniqueSlug(base: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("blog_posts").select("slug");
  const used = new Set((data ?? []).map((row) => (row as { slug: string }).slug));

  let slug = base;
  for (let suffix = 2; used.has(slug); suffix += 1) {
    slug = `${base}-${suffix}`.slice(0, 78);
  }
  return slug;
}

/**
 * One draft, start to finish. Shared by the 12:00 UTC cron and the
 * "generate now" button, so both paths behave identically and both log to
 * `ai_logs`.
 */
export async function generateBlogDraft(force?: Audience): Promise<GenerateResult> {
  const supabase = getSupabaseAdmin();
  const audience = force ?? audienceForDate();
  const scenario = audience === "C" ? "blog_generation_c" : "blog_generation_b";

  const topic = await findTopic(audience);
  const slug = await uniqueSlug(slugify(topic.title) || "cat-furniture-note");

  const input = `[source=${topic.source}][audience=${audience}]
Reader question: ${topic.title}
Context: ${topic.excerpt || "(no body)"}

Return exactly in this format:
TITLE: <under 65 characters>
SUMMARY: <one sentence, under 160 characters>
---
<article in plain Markdown, no headings>`;

  const result = await runAi({
    scenario,
    input,
    maxTokens: audience === "C" ? 420 : 520,
    temperature: 0.85,
  });

  if (!result.ok || !result.text) {
    return { ok: false, error: result.error ?? "AI failed", source: topic.source, audience };
  }

  const parsed = parseOutput(result.text, topic.title);

  let content = parsed.summary ? `> ${parsed.summary}\n\n${parsed.body}` : parsed.body;
  content += referencesMarkdown(audience);
  if (audience === "C") content += `\n\n${B2B_BANNER}`;

  const payload: Record<string, unknown> = {
    slug,
    title: parsed.title,
    content,
    cover_image: "/images/journal-8782.webp",
    status: "draft",
    target_audience: audience,
  };

  let { data, error } = await supabase
    .from("blog_posts")
    .insert(payload)
    .select("id, slug, title")
    .single();

  // Deploy-safe: if migration 0007 has not run yet, still store the draft.
  if (error && /target_audience|PGRST204|42703/i.test(`${error.message} ${error.code}`)) {
    delete payload.target_audience;
    ({ data, error } = await supabase.from("blog_posts").insert(payload).select("id, slug, title").single());
  }

  if (error) {
    return { ok: false, error: error.message, source: topic.source, audience };
  }

  return {
    ok: true,
    id: (data as { id: string }).id,
    slug: (data as { slug: string }).slug,
    title: (data as { title: string }).title,
    audience,
    source: topic.source,
    question: topic.title,
    tokens: result.tokens,
    attempts: topic.attempts,
  };
}
