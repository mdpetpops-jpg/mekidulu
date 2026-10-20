#!/usr/bin/env node
/**
 * Send one test cold email through the deployed outreach pipeline.
 *
 *   CRON_SECRET=... node scripts/test-outreach.mjs [recipient]
 *
 * Defaults to wuhp@live.com. Uses the production endpoint so it exercises the
 * real DeepSeek + Brevo credentials that only exist on Vercel.
 */

const BASE = process.env.BASE_URL ?? "https://www.mekidulu.com";
const SECRET = process.env.CRON_SECRET;
const TO = process.argv[2] ?? "wuhp@live.com";

if (!SECRET) {
  console.error("CRON_SECRET is required.");
  process.exit(1);
}

const url = `${BASE}/api/cron/outreach?test=${encodeURIComponent(TO)}`;

let response;
for (let attempt = 0; attempt < 4; attempt += 1) {
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": SECRET },
      signal: AbortSignal.timeout(60_000),
    });
    break;
  } catch (error) {
    console.log(`attempt ${attempt + 1} failed: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
  }
}

if (!response) {
  console.error("Could not reach the endpoint.");
  process.exit(1);
}

const body = await response.text();
console.log(`POST ${url}`);
console.log(`status: ${response.status}`);
console.log(`body: ${body}`);
process.exit(response.ok ? 0 : 1);
