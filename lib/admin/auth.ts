/**
 * Admin session handling.
 *
 * The password lives only in `ADMIN_PASSWORD`. The cookie carries an HMAC of a
 * fixed string keyed by that password, so rotating the password invalidates
 * every existing session.
 */

import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mekidulu_admin";
const SESSION_PAYLOAD = "mekidulu-admin-session-v1";

function secret(): string | null {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

export function adminConfigured(): boolean {
  return Boolean(secret());
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

export async function signSession(): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(SESSION_PAYLOAD));
  return toBase64Url(signature);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await signSession();
  if (!expected) return false;
  // Constant-time-ish comparison; tokens are short and random enough.
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i += 1) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function verifyPassword(input: string): boolean {
  const key = secret();
  return Boolean(key) && input === key;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
