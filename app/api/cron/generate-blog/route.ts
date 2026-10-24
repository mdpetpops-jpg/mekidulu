import { NextResponse } from "next/server";

import { generateBlogDraft } from "@/lib/blog/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";
  return header === secret;
}

/**
 * 12:00 UTC daily (08:00 New York).
 *
 * Topic: Reddit Atom RSS → Google Trends RSS → local bank of 20 pain points.
 * Output: one `draft` in blog_posts, one `blog_generation` row in ai_logs.
 */
async function run(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const result = await generateBlogDraft();
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json({ ...result, ok: true });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
