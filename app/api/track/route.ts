import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  sessionId: z.string().trim().min(6).max(64),
  path: z.string().trim().min(1).max(300),
  duration: z.number().int().min(0).max(86_400),
});

function deviceType(userAgent: string): "Mobile" | "Desktop" | "Tablet" {
  if (/iPad|Tablet/i.test(userAgent)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  const { sessionId, path, duration } = parsed.data;

  // Never record the admin area.
  if (path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null;

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("visitor_logs").insert({
      session_id: sessionId,
      country,
      device_type: deviceType(request.headers.get("user-agent") ?? ""),
      path,
      duration,
    });
  } catch {
    // analytics must never break a request
  }

  return NextResponse.json({ ok: true });
}
