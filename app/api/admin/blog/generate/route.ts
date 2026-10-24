import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/auth";
import { generateBlogDraft } from "@/lib/blog/generate";
import { findTopic } from "@/lib/blog/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Which channel is actually answering right now (rss / trends / fallback). */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const topic = await findTopic();
  return NextResponse.json({
    ok: true,
    source: topic.source,
    topic: topic.title,
    attempts: topic.attempts,
  });
}

/** "Generate now" from the admin UI — no cron secret needed. */
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const result = await generateBlogDraft();
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  revalidatePath("/admin/blog");
  return NextResponse.json(result);
}
