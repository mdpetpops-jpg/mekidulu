import { NextResponse } from "next/server";

import { runAi } from "@/lib/ai";
import { brevoConfigured, sendEmail } from "@/lib/brevo";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Hard ceiling on generation length — keeps the token bill tiny. */
const MAX_TOKENS = 150;

type OutreachRow = {
  id: string;
  email: string;
  store_name: string | null;
  website: string | null;
  send_status: string | null;
};

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";
  return header === secret;
}

function unsubscribeUrl(email: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mekidulu.com").replace(/\/$/, "");
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}`;
}

async function run(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!brevoConfigured()) {
    return NextResponse.json({ ok: false, error: "Brevo credentials are not usable." }, { status: 503 });
  }

  const url = new URL(request.url);

  // 13:00 UTC is 09:00 New York in summer and 08:00 in winter; anything else is
  // a stray manual trigger. ?force=1 bypasses this for deliberate runs.
  if (!url.searchParams.has("force")) {
    const etHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
    );
    if (etHour !== 9 && etHour !== 8) {
      return NextResponse.json({ ok: true, skipped: true, reason: `New York hour is ${etHour}.` });
    }
  }

  const supabase = getSupabaseAdmin();
  const batchSize = Math.min(Number(process.env.OUTREACH_BATCH_SIZE ?? "3"), 10);

  const { data, error } = await supabase
    .from("outreach_emails")
    .select("id, email, store_name, website, send_status")
    .or("send_status.is.null,send_status.eq.pending")
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not read outreach_emails.", code: error.code }, { status: 502 });
  }

  const rows = (data ?? []) as OutreachRow[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No pending outreach." });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const row of rows) {
    const store = row.store_name || "your store";
    const input = `Store: ${store}
Website: ${row.website ?? "unknown"}

Write the email body only (no subject line). End with a blank line then: "Unsubscribe: ${unsubscribeUrl(row.email)}"`;

    const ai = await runAi({
      scenario: "outreach_email",
      input,
      maxTokens: MAX_TOKENS,
      temperature: 0.7,
    });

    if (!ai.ok || !ai.text) {
      await supabase
        .from("outreach_emails")
        .update({ send_status: "failed", fetch_status: "failed" })
        .eq("id", row.id);
      results.push({ id: row.id, ok: false, error: ai.error ?? "AI failed" });
      continue;
    }

    const result = await sendEmail({
      to: row.email,
      toName: row.store_name ?? undefined,
      subject: `Wood cat trees for ${store} — factory direct, from 5 units`,
      text: ai.text,
      replyTo: "sales@mekidulu.com",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl(row.email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Button",
      },
    });

    await supabase
      .from("outreach_emails")
      .update({
        send_status: result.ok ? "sent" : "failed",
        reply_status: result.ok ? "waiting" : null,
      })
      .eq("id", row.id);

    results.push({ id: row.id, ok: result.ok, error: result.ok ? undefined : result.error });

    // Breathing room between messages inside one invocation.
    if (row !== rows[rows.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const sent = results.filter((entry) => entry.ok).length;
  return NextResponse.json({ ok: true, candidates: rows.length, sent, failed: results.length - sent, results });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
