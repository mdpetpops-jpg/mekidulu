import { NextResponse } from "next/server";

import { runAi } from "@/lib/ai";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUBREDDITS = ["CatAdvice", "cats", "CatTraining"];

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";
  return header === secret;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);
}

type RedditPost = { title: string; selftext?: string; permalink?: string; subreddit?: string };

/** Token budget: 5 posts, title + 150 chars of body. No comments, ever. */
const MAX_POSTS = 5;
const SELFTEXT_CHARS = 150;

/**
 * Reddit blocks data-centre IPs, so the daily run must not depend on it.
 * If the fetch fails we still write a draft from this bank, rotating by day.
 */
const FALLBACK_QUESTIONS: { title: string; selftext: string }[] = [
  { title: "My cat destroyed the sofa — what actually stops scratching?", selftext: "I have tried sprays, foil and double-sided tape. Nothing works for more than a week." },
  { title: "Why does my cat tree wobble when my cat jumps on it?", selftext: "It is a cheap carpet tower from a marketplace. The base feels thin and the whole thing leans." },
  { title: "Do cats actually use the top platform, or is it a waste?", selftext: "Mine only uses the middle shelf. Wondering whether height matters for a single cat." },
  { title: "Carpet or wood cat furniture for a small apartment?", selftext: "Carpet traps hair and smells. Wood looks better but I worry it is slippery." },
  { title: "How do you stop a cat tree from tipping over?", selftext: "My two cats race up it and I am scared it will fall on one of them." },
  { title: "Is a tall cat tree worth it for two cats?", selftext: "They fight over the one high spot we have and I am not sure what to buy." },
  { title: "Should I replace the sisal rope or the whole cat tree?", selftext: "The posts are shredded but the platforms are fine. It is a big tower." },
];

function fallbackQuestion(): { title: string; selftext: string } {
  const day = Math.floor(Date.now() / 86_400_000);
  return FALLBACK_QUESTIONS[day % FALLBACK_QUESTIONS.length];
}

async function fetchQuestions(): Promise<{ posts: RedditPost[]; source: "reddit" | "fallback"; status: number[] }> {
  const collected: RedditPost[] = [];
  const status: number[] = [];

  for (const subreddit of SUBREDDITS) {
    if (collected.length >= MAX_POSTS) break;
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=5`, {
        headers: { "User-Agent": "mekidulu-content-bot/1.0 (site admin)" },
        signal: AbortSignal.timeout(8_000),
      });
      status.push(response.status);
      if (!response.ok) continue;
      const payload = (await response.json()) as {
        data?: { children?: { data: RedditPost }[] };
      };
      for (const child of payload.data?.children ?? []) {
        const post = child.data;
        if (!post?.title) continue;
        collected.push({
          title: post.title.slice(0, 200),
          selftext: (post.selftext ?? "").slice(0, SELFTEXT_CHARS),
          permalink: post.permalink,
          subreddit: post.subreddit,
        });
        if (collected.length >= MAX_POSTS) break;
      }
    } catch {
      status.push(0);
    }
  }

  if (collected.length > 0) return { posts: collected.slice(0, MAX_POSTS), source: "reddit", status };
  return { posts: [fallbackQuestion()], source: "fallback", status };
}

function parseOutput(raw: string, fallbackTitle: string) {
  const titleMatch = raw.match(/^\s*(?:TITLE|Title)\s*:\s*(.+)$/m);
  const summaryMatch = raw.match(/^\s*(?:SUMMARY|Summary)\s*:\s*(.+)$/m);
  const body = raw.replace(/^\s*(?:TITLE|Title)\s*:.*$/m, "").replace(/^\s*(?:SUMMARY|Summary)\s*:.*$/m, "").replace(/^\s*---\s*$/m, "").trim();

  return {
    title: (titleMatch?.[1] ?? fallbackTitle).replace(/^["']|["']$/g, "").slice(0, 180),
    summary: (summaryMatch?.[1] ?? "").slice(0, 300),
    body: body || raw,
  };
}

async function run(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.has("dry");
  const diagnose = url.searchParams.has("diagnose");

  const supabase = getSupabaseAdmin();

  const { posts: questions, source, status } = await fetchQuestions();

  if (diagnose) {
    return NextResponse.json({ ok: true, redditStatus: status, source, sample: questions.map((q) => q.title) });
  }

  if (questions.length === 0) {
    return NextResponse.json({ ok: false, error: "No questions from Reddit or the fallback bank." }, { status: 502 });
  }

  // Prefer a question whose slug we have not used yet.
  const { data: existing } = await supabase.from("blog_posts").select("slug");
  const usedSlugs = new Set((existing ?? []).map((row) => (row as { slug: string }).slug));

  let chosen: RedditPost | undefined;
  let slug = "";
  for (const question of questions) {
    const candidate = slugify(question.title);
    if (!candidate || usedSlugs.has(candidate)) continue;
    chosen = question;
    slug = candidate;
    break;
  }

  if (!chosen) {
    return NextResponse.json({ ok: true, skipped: true, reason: "All fetched questions already exist." });
  }

  const input = `${source === "reddit" ? "Reddit question" : "Reader question"}: ${chosen.title}
Context: ${chosen.selftext || "(no body)"}
${chosen.permalink ? `Source: reddit.com${chosen.permalink}` : ""}

Return exactly in this format:
TITLE: <under 65 characters>
SUMMARY: <one sentence, under 160 characters>
---
<300-word article in plain Markdown>`;

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true, source, question: chosen.title, slug });
  }

  const result = await runAi({ scenario: "blog_generation", input, maxTokens: 700, temperature: 0.8 });
  if (!result.ok || !result.text) {
    return NextResponse.json({ ok: false, error: result.error ?? "AI failed" }, { status: 502 });
  }

  const parsed = parseOutput(result.text, chosen.title);

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
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 502 });
  }

  return NextResponse.json({ ok: true, created: data, tokens: result.tokens, source, question: chosen.title });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
