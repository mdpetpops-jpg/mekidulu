/**
 * Optional Upstash QStash integration.
 *
 * When `QSTASH_TOKEN` is present, the daily cron enqueues one delayed message
 * per prospect (3–8 minutes apart) instead of sending inside a single function
 * invocation. Without it, the cron falls back to a small in-function batch,
 * which keeps the feature working on any Vercel plan.
 */

export function qstashConfigured(): boolean {
  return Boolean(process.env.QSTASH_TOKEN?.trim());
}

export type EnqueueInput = {
  prospectId: string;
  delaySeconds: number;
  origin: string;
  forwardAuthorization: string;
};

export async function enqueueOutreach(input: EnqueueInput): Promise<boolean> {
  const token = process.env.QSTASH_TOKEN?.trim();
  if (!token) return false;

  const target = `${input.origin}/api/outreach/worker`;

  try {
    const response = await fetch(
      `https://qstash.upstash.io/v2/publish/${encodeURIComponent(target)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Upstash-Delay": `${input.delaySeconds}s`,
          "Upstash-Retries": "2",
          "Upstash-Forward-Authorization": input.forwardAuthorization,
        },
        body: JSON.stringify({ prospectId: input.prospectId }),
      },
    );

    if (!response.ok) {
      console.error("[qstash] publish failed:", response.status, (await response.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[qstash] request failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
