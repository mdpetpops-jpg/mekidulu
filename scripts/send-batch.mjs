#!/usr/bin/env node
/**
 * Manual outreach batch — sends N pending prospects right now, outside the cron.
 *
 *   node scripts/send-batch.mjs --dry-run          # show what would happen
 *   node scripts/send-batch.mjs --cleanup          # mark duplicates / role inboxes
 *   node scripts/send-batch.mjs --limit 5          # send 5
 *
 * Uses the same prompt (`ai_prompts.outreach_email`), the same token cap (150),
 * and the same status fields as the cron, so the admin shows the results.
 */

import nodemailer from "nodemailer";

const SB = "https://kmqzkvpwsuutfrizvsiv.supabase.co";
const KEY = process.env.SB_SECRET;
const DEEPSEEK = process.env.DEEPSEEK_API_KEY;
const SMTP_USER = "bf204c001@smtp-brevo.com";
const SMTP_PASS = process.env.BREVO_SMTP_KEY;
const SENDER = { name: "Mekidulu", email: "sales@mekidulu.com" };

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || 5;
const dryRun = args.includes("--dry-run");
const cleanup = args.includes("--cleanup");

const BAD_LOCAL = [
  "privacy", "accounting", "webmaster", "postmaster", "abuse", "hostmaster", "admin",
  "noreply", "no-reply", "donotreply", "billing", "invoice", "jobs", "career", "hr",
  "legal", "dpo", "gdpr",
];

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, init = {}) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { ...headers, ...(init.headers ?? {}) }, ...init });
      return { status: r.status, text: await r.text() };
    } catch {
      await new Promise((x) => setTimeout(x, 1500));
    }
  }
  return { status: 0, text: "network" };
}

async function getPrompt() {
  const { text } = await rest("ai_prompts?scenario=eq.outreach_email&is_active=eq.true&select=prompt_content&limit=1");
  try {
    return JSON.parse(text)[0]?.prompt_content ?? "You are the export sales director of Mekidulu. Write a 90-110 word cold email mentioning low MOQ from 10 units and dropshipping. Return only the body.";
  } catch {
    return "You are the export sales director of Mekidulu. Write a 90-110 word cold email mentioning low MOQ from 10 units and dropshipping. Return only the body.";
  }
}

function storeFromEmail(email) {
  const domain = email.split("@")[1] ?? "";
  const label = domain.split(".")[0] ?? "your store";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

async function main() {
  if (!KEY || !DEEPSEEK || !SMTP_PASS) {
    console.error("Missing SB_SECRET / DEEPSEEK_API_KEY / BREVO_SMTP_KEY.");
    process.exit(1);
  }

  const { text } = await rest(
    "outreach_emails?select=id,email,store_name,website,send_status&send_status=eq.pending&order=created_at.asc&limit=500",
  );
  const rows = JSON.parse(text);
  console.log(`pending rows: ${rows.length}`);

  // De-duplicate by address and drop role inboxes that hurt deliverability.
  const seen = new Set();
  const keep = [];
  const drop = [];
  for (const row of rows) {
    const local = (row.email ?? "").split("@")[0].toLowerCase();
    const key = (row.email ?? "").toLowerCase();
    if (!row.email) continue;
    if (seen.has(key)) {
      drop.push({ row, reason: "duplicate" });
      continue;
    }
    seen.add(key);
    if (BAD_LOCAL.includes(local)) {
      drop.push({ row, reason: `role inbox (${local}@)` });
      continue;
    }
    keep.push(row);
  }

  console.log(`unique personal/business inboxes: ${keep.length}`);
  if (drop.length) console.log(`will skip: ${drop.length} (${drop.slice(0, 5).map((d) => d.reason).join(", ")}…)`);

  if (cleanup) {
    for (const { row } of drop) {
      await rest(`outreach_emails?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ send_status: "skipped" }) });
    }
    console.log(`marked ${drop.length} rows as skipped`);
    return;
  }

  const batch = keep.slice(0, limit);
  if (dryRun) {
    for (const row of batch) console.log(`  would send → ${row.email}`);
    return;
  }

  const prompt = await getPrompt();
  const FACTS = `HARD FACTS — do not change these numbers or invent others:
- MOQ: exactly 10 units.
- Dropshipping: supported, one unit at a time.
- No prices, no discounts, no delivery dates.`;

  const check = (text) => {
    if (!text || text.trim().length < 60) return "too short";
    if (/(?:\$|usd|eur|€)\s?\d/i.test(text)) return "contains a price";
    for (const m of text.matchAll(/(\d+)\s*(?:units?|pieces?|pcs|sets?)\b/gi)) {
      if (Number(m[1]) !== 10) return `wrong unit count: ${m[0]}`;
    }
    if (!/unsubscribe/i.test(text)) return "missing unsubscribe";
    return null;
  };

  const transport = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  let sent = 0;
  let firstBody = null;
  const rejected = [];

  for (const row of batch) {
    const store = row.store_name || storeFromEmail(row.email);
    const unsubscribe = `https://www.mekidulu.com/unsubscribe?email=${encodeURIComponent(row.email)}`;
    const userInput = `Store: ${store}\nWebsite: ${row.website ?? "unknown"}\n\nWrite the body only, then a blank line and: Unsubscribe: ${unsubscribe}`;

    let body = null;
    const problems = [];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const ai = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.7,
          max_tokens: 150,
          messages: [
            { role: "system", content: attempt === 0 ? prompt : `${prompt}\n\n${FACTS}` },
            { role: "user", content: userInput },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });
      const payload = await ai.json();
      const candidate = payload.choices?.[0]?.message?.content?.trim();
      const problem = check(candidate);
      if (!problem) {
        // Never trust the model with the URL: strip its line, append the exact one.
        body = candidate
          .split("\n")
          .filter((line) => !/^\s*unsubscribe\s*:/i.test(line))
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim() + `\n\nUnsubscribe: ${unsubscribe}`;
        break;
      }
      problems.push(problem);
    }

    if (!body) {
      await rest(`outreach_emails?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ send_status: "failed" }) });
      rejected.push({ email: row.email, reasons: problems });
      console.log(`  ✗ ${row.email} — rejected (${problems.join("; ")})`);
      continue;
    }
    if (!firstBody) firstBody = { store, email: row.email, body };

    try {
      await transport.sendMail({
        from: { name: SENDER.name, address: SENDER.email },
        to: row.email,
        subject: `Wood cat trees for ${store} — factory direct, from 10 units`,
        text: body,
        headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      await rest(`outreach_emails?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ send_status: "sent", reply_status: "waiting" }),
      });
      sent += 1;
      console.log(`  ✓ ${row.email} (${store})`);
    } catch (error) {
      await rest(`outreach_emails?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ send_status: "failed" }),
      });
      console.log(`  ✗ ${row.email} — ${String(error.message).slice(0, 80)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  transport.close();
  console.log(`\nsent ${sent}/${batch.length}`);
  if (firstBody) {
    console.log(`\n--- sample to ${firstBody.email} (${firstBody.store}) ---`);
    console.log(firstBody.body);
  }
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exit(1);
});
