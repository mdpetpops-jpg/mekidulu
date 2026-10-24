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

async function fetchQuestions(): Promise<RedditPost[]> {
  const collected: RedditPost[] = [];
  for (const subreddit of SUBREDDITS) {
    if (collected.length >= MAX_POSTS) break;
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=5`, {
        headers: { "User-Agent": "mekidulu-content-bot/1.0 (site admin)" },
        signal: AbortSignal.timeout(15_000),
      });
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
      // one subreddit failing should not abort the run
    }
  }
  return collected.slice(0, MAX_POSTS);
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

  const supabase = getSupabaseAdmin();

  const questions = await fetchQuestions();
  if (questions.length === 0) {
    return NextResponse.json({ ok: false, error: "Reddit returned no questions." }, { status: 502 });
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

  const input = `Reddit question: ${chosen.title}
Context: ${chosen.selftext || "(no body)"}
Source: reddit.com${chosen.permalink ?? ""}

Return exactly in this format:
TITLE: <under 65 characters>
SUMMARY: <one sentence, under 160 characters>
---
<300-word article in plain Markdown>`;

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true, question: chosen.title, slug });
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

  return NextResponse.json({ ok: true, created: data, tokens: result.tokens, source: chosen.title });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
