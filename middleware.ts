import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "mekidulu_admin";

const SKIP_PREFIXES = ["/_next", "/api", "/admin", "/images", "/manuals", "/catalog", "/favicon", "/icon", "/apple-icon"];

function isPageRequest(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const { pathname } = request.nextUrl;
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

async function verifySession(token: string | undefined): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password || !token) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("mekidulu-admin-session-v1"),
  );
  const expected = Buffer.from(signature).toString("base64url");
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i += 1) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function ipHash(ip: string): Promise<string> {
  const salt = process.env.TRAFFIC_SALT ?? "mekidulu";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Buffer.from(digest).toString("hex").slice(0, 32);
}

function track(request: NextRequest, event: { waitUntil: (p: Promise<unknown>) => void }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY1;
  if (!url || !key) return;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const body = {
    path: request.nextUrl.pathname,
    referrer: (request.headers.get("referer") ?? "").slice(0, 500) || null,
    ip_hash: null as string | null,
  };

  event.waitUntil(
    (async () => {
      body.ip_hash = await ipHash(ip);
      await fetch(`${url}/rest/v1/traffic_logs`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      }).catch(() => undefined);
    })(),
  );
}

export async function middleware(request: NextRequest, event: { waitUntil: (p: Promise<unknown>) => void }) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const authed = await verifySession(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!authed) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (isPageRequest(request)) track(request, event);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next|api|images|manuals|catalog|favicon.ico).*)"],
};
