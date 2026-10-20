import { NextResponse } from "next/server";

import { brevoConfigured } from "@/lib/brevo";
import { sendColdEmailTo, type Prospect } from "@/lib/outreach/sender";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * QStash target: sends exactly one prospect, then marks it sent/failed.
 * Authenticated with the same secret the cron forwards.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";

  if (!secret || header !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!brevoConfigured()) {
    return NextResponse.json(
      { ok: false, error: "BREVO_API_KEY is not configured in this environment." },
      { status: 503 },
    );
  }

  let body: { prospectId?: string };
  try {
    body = (await request.json()) as { prospectId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON body." }, { status: 400 });
  }

  if (!body.prospectId) {
    return NextResponse.json({ ok: false, error: "prospectId is required." }, { status: 422 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, email, store_name, website, status")
    .eq("id", body.prospectId)
    .maybeSingle();

  if (error) {
    console.error("[outreach/worker] lookup failed:", error.code, error.message);
    return NextResponse.json({ ok: false, error: "Lookup failed." }, { status: 502 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Prospect not found." }, { status: 404 });
  }

  const prospect = data as Prospect;
  if (prospect.status !== "pending") {
    return NextResponse.json({ ok: true, skipped: true, status: prospect.status });
  }

  const result = await sendColdEmailTo(prospect);
  return NextResponse.json(
    { ok: result.ok, id: prospect.id, error: result.error },
    { status: result.ok ? 200 : 502 },
  );
}
