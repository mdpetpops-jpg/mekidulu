import { NextResponse } from "next/server";

import { brevoConfigured, brevoDiagnostics } from "@/lib/brevo";
import { enqueueOutreach, qstashConfigured } from "@/lib/outreach/qstash";
import {
  randomDelaySeconds,
  sendColdEmailTo,
  siteOrigin,
  type Prospect,
} from "@/lib/outreach/sender";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** How many prospects one run may handle. Kept small on purpose. */
const BATCH_SIZE = Number(process.env.OUTREACH_BATCH_SIZE ?? "2");
/** Gap between sends when QStash is not configured (function time budget). */
const INLINE_GAP_MS = Number(process.env.OUTREACH_GAP_MS ?? "12000");

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";
  return header === secret;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  if (!authorised(request)) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  if (!brevoConfigured()) {
    return json(
      {
        ok: false,
        error: "Brevo credentials are not usable in this environment.",
        brevo: brevoDiagnostics(),
      },
      503,
    );
  }

  const url = new URL(request.url);
  const testEmail = url.searchParams.get("test");

  // Manual single test: sends one cold email to the given address, no DB write.
  if (testEmail) {
    const prospect: Prospect = {
      id: "test",
      email: testEmail,
      store_name: "Test Store",
      website: "https://example.com",
      status: "pending",
    };
    const result = await sendColdEmailTo({ ...prospect, id: "00000000-0000-0000-0000-000000000000" });
    return json({ ok: result.ok, mode: "test", to: testEmail, error: result.error }, result.ok ? 200 : 502);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, email, store_name, website, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[cron/outreach] query failed:", error.code, error.message);
    return json({ ok: false, error: "Could not read the prospect queue." }, 502);
  }

  const prospects = (data ?? []) as Prospect[];
  if (prospects.length === 0) {
    return json({ ok: true, mode: "idle", queued: 0, sent: 0, message: "No pending prospects." });
  }

  // Preferred path: one delayed job per prospect, 3–8 minutes apart.
  if (qstashConfigured()) {
    const origin = url.origin || siteOrigin();
    let queued = 0;
    for (const [index, prospect] of prospects.entries()) {
      const delay = (index + 1) * randomDelaySeconds();
      const ok = await enqueueOutreach({
        prospectId: prospect.id,
        delaySeconds: delay,
        origin,
        forwardAuthorization: `Bearer ${process.env.CRON_SECRET}`,
      });
      if (ok) queued += 1;
    }
    return json({ ok: true, mode: "qstash", queued, candidates: prospects.length });
  }

  // Fallback: small sequential batch inside this invocation.
  const started = Date.now();
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const [index, prospect] of prospects.entries()) {
    if (index > 0) {
      if (Date.now() - started > 240_000) {
        results.push({ id: prospect.id, ok: false, error: "skipped: time budget" });
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, INLINE_GAP_MS));
    }
    const result = await sendColdEmailTo(prospect);
    results.push({ id: prospect.id, ok: result.ok, error: result.error });
  }

  const sent = results.filter((r) => r.ok).length;
  return json({
    ok: sent > 0,
    mode: "inline",
    candidates: prospects.length,
    sent,
    failed: results.length - sent,
    results,
  });
}
