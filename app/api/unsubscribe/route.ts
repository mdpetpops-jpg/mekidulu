import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().min(3).max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
});

/**
 * One-click unsubscribe for outreach email.
 * Opt-out endpoints are intentionally unauthenticated — that is the point of a
 * working unsubscribe link. It can only ever move a row to `unsubscribed`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("prospects")
      .update({ status: "unsubscribed" })
      .eq("email", email);

    if (error) {
      console.error("[unsubscribe] update failed:", error.code, error.message);
      return NextResponse.json({ ok: false, error: "Could not update your record." }, { status: 502 });
    }
  } catch (error) {
    console.error("[unsubscribe] configuration error:", error);
    return NextResponse.json({ ok: false, error: "Service unavailable." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
