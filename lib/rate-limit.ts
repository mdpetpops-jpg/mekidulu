/**
 * Best-effort in-memory rate limiter.
 *
 * This is intentionally dependency-free. On Vercel each serverless instance
 * keeps its own map, so it damps casual form flooding but is not a hard global
 * guarantee. If you ever need strict limits, swap the store for Upstash Redis
 * and keep this function signature.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  now: number = Date.now(),
): { ok: boolean; retryAfterSeconds: number } {
  if (now - lastSweep > WINDOW_MS) {
    sweep(now);
    lastSweep = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}
