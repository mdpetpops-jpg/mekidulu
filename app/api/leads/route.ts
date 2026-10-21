import { NextResponse } from "next/server";
import { after } from "next/server";

import { runAi } from "@/lib/ai";
import { brevoConfigured, sendEmail } from "@/lib/brevo";
import { deepseekConfigured } from "@/lib/deepseek";
import { fieldErrors, leadSchema } from "@/lib/leads/schema";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin, SupabaseConfigError } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 8 KB is plenty for five short fields and keeps junk bodies cheap to reject. */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Runs after the response is flushed, so a slow provider never delays the form.
 * The prompt comes from `ai_prompts` (editable in /admin/ai) and the call is
 * logged to `ai_logs`.
 */
async function sendAutoReply(lead: {
  businessEmail: string;
  companyName: string;
  estimatedVolume?: string;
}) {
  if (!brevoConfigured() || !deepseekConfigured()) {
    console.warn("[api/leads] auto-reply skipped: email/LLM provider not configured.");
    return;
  }

  const ai = await runAi({
    scenario: "lead_thankyou",
    input: `Company: ${lead.companyName || "unknown"}; email: ${lead.businessEmail}; estimated volume: ${lead.estimatedVolume ?? "not specified"}.`,
    maxTokens: 260,
    temperature: 0.5,
  });

  if (!ai.ok || !ai.text) {
    console.error("[api/leads] auto-reply generation failed:", ai.error);
    return;
  }

  const result = await sendEmail({
    to: lead.businessEmail,
    toName: lead.companyName || undefined,
    subject: "Your Mekidulu wholesale inquiry",
    text: ai.text,
    replyTo: "sales@mekidulu.com",
  });

  if (!result.ok) {
    console.error("[api/leads] auto-reply failed:", result.status, result.error);
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    const ip = first?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status, headers },
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError("Expected a JSON request body.", 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed JSON body.", 400);
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please check the highlighted fields.", 422, {
      fieldErrors: fieldErrors(parsed.error),
    });
  }

  const lead = parsed.data;

  // Honeypot hit: accept silently so bots do not learn the rule, store nothing.
  if (lead.companyUrl) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const limit = rateLimit(`leads:${clientIp(request)}`);
  if (!limit.ok) {
    return jsonError(
      "Too many inquiries from this connection. Please try again shortly.",
      429,
      undefined,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      // Configuration problem, not a user problem — log it, keep secrets out
      // of the response, and fail loudly in the server logs.
      console.error("[api/leads] configuration error:", error.message);
      return jsonError(
        "Lead capture is temporarily unavailable. Please try again later.",
        503,
      );
    }
    throw error;
  }

  const referer = request.headers.get("referer");
  let pagePath: string | null = null;
  if (referer) {
    try {
      pagePath = new URL(referer).pathname;
    } catch {
      pagePath = null;
    }
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      business_email: lead.businessEmail,
      company_name: lead.companyName || null,
      estimated_volume: lead.estimatedVolume ?? null,
      notes: lead.notes || null,
      source: "website",
      // The page the visitor submitted from, not the API route itself.
      page_path: pagePath,
      referrer: referer?.slice(0, 500) ?? null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // Supabase error objects are explicit about the failure but never contain
    // the key itself. Log the details, return something actionable to the user.
    console.error(
      "[api/leads] insert failed:",
      error.code,
      error.message,
      error.details,
      error.hint,
    );
    // The PostgREST/Postgres error class is safe to expose and makes
    // misconfiguration (missing table, wrong key) diagnosable from outside.
    // `detail` carries the server message so a wrong Supabase project/key is
    // obvious without having to open the Vercel log stream.
    return jsonError(
      "We could not save your inquiry. Please try again in a moment.",
      502,
      {
        code: error.code || "unknown",
        detail: String(error.message ?? "").slice(0, 180),
      },
    );
  }

  after(() =>
    sendAutoReply({
      businessEmail: lead.businessEmail,
      companyName: lead.companyName,
      estimatedVolume: lead.estimatedVolume,
    }),
  );

  return NextResponse.json({ ok: true, id: data?.id ?? null }, { status: 201 });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
