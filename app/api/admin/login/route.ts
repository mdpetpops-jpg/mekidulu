import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  adminConfigured,
  signSession,
  verifyPassword,
} from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD is not configured in this environment." },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (!body.password || !verifyPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "Wrong password." }, { status: 401 });
  }

  const token = await signSession();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Session unavailable." }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
