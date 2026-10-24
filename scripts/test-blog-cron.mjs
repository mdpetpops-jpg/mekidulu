#!/usr/bin/env node
/**
 * Local dry-run of /api/cron/generate-blog: same prompt, same model, same
 * parser, same insert — so the daily cron can be checked without the secret.
 *
 *   node scripts/test-blog-cron.mjs [--no-insert]
 */

import fs from "node:fs";

const SB = "https://kmqzkvpwsuutfrizvsiv.supabase.co";
const KEY = process.env.SB_SECRET;
const DEEPSEEK = process.env.DEEPSEEK_API_KEY;
const insert = !process.argv.includes("--no-insert");

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const FALLBACK = [
  { title: "My cat destroyed the sofa — what actually stops scratching?", selftext: "I have tried sprays, foil and double-sided tape. Nothing works for more than a week." },
  { title: "Why does my cat tree wobble when my cat jumps on it?", selftext: "It is a cheap carpet tower from a marketplace. The base feels thin and the whole thing leans." },
  { title: "Do cats actually use the top platform, or is it a waste?", selftext: "Mine only uses the middle shelf. Wondering whether height matters for a single cat." },
  { title: "Carpet or wood cat furniture for a small apartment?", selftext: "Carpet traps hair and smells. Wood looks better but I worry it is slippery." },
  { title: "How do you stop a cat tree from tipping over?", selftext: "My two cats race up it and I am scared it will fall on one of them." },
  { title: "Is a tall cat tree worth it for two cats?", selftext: "They fight over the one high spot we have and I am not sure what to buy." },
  { title: "Should I replace the sisal rope or the whole cat tree?", selftext: "The posts are shredded but the platforms are fine. It is a big tower." },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 70);

const promptRes = await fetch(`${SB}/rest/v1/ai_prompts?scenario=eq.blog_generation&is_active=eq.true&select=prompt_content&limit=1`, { headers });
const prompt = (await promptRes.json())[0]?.prompt_content;
if (!prompt) throw new Error("no blog_generation prompt");

const question = FALLBACK[Math.floor(Date.now() / 86_400_000) % FALLBACK.length];
console.log(`question: ${question.title}\n`);

const started = Date.now();
const ai = await fetch("https://api.deepseek.com/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK}` },
  body: JSON.stringify({
    model: "deepseek-chat",
    temperature: 0.8,
    max_tokens: 700,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Reader question: ${question.title}\nContext: ${question.selftext}\n\nReturn exactly:\nTITLE: <under 65 characters>\nSUMMARY: <one sentence, under 160 characters>\n---\n<300-word article in plain Markdown>` },
    ],
  }),
  signal: AbortSignal.timeout(60000),
});

const payload = await ai.json();
const raw = payload.choices?.[0]?.message?.content?.trim() ?? "";
const tokens = payload.usage?.total_tokens ?? 0;

const titleMatch = raw.match(/^\s*TITLE\s*:\s*(.+)$/m);
const summaryMatch = raw.match(/^\s*SUMMARY\s*:\s*(.+)$/m);
const body = raw.replace(/^\s*(?:TITLE|SUMMARY)\s*:.*$/gm, "").replace(/^\s*---\s*$/m, "").trim();

const title = (titleMatch?.[1] ?? question.title).slice(0, 180);
const summary = (summaryMatch?.[1] ?? "").slice(0, 300);
const words = body.split(/\s+/).filter(Boolean).length;

const banned = ["In conclusion", "Furthermore", "Moreover", "delve", "landscape", "testament"]
  .filter((phrase) => new RegExp(phrase, "i").test(body));

console.log(`tokens: ${tokens} · ${Date.now() - started}ms · words: ${words}`);
console.log(`title: ${title}`);
console.log(`summary: ${summary}`);
console.log(`banned phrases: ${banned.length ? banned.join(", ") : "none ✔"}`);
console.log(`first person "I": ${/\bI\b/.test(body) ? "yes ✔" : "no ✗"}`);
console.log(`mentions Mekidulu: ${/mekidulu/i.test(body) ? "yes ✔" : "no ✗"}`);
console.log(`\n--- body preview ---\n${body.slice(0, 600)}\n`);

fs.writeFileSync("_blog_draft.md", `${title}\n\n${summary}\n\n${body}`);

if (insert) {
  const slug = `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
  const res = await fetch(`${SB}/rest/v1/blog_posts`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      slug,
      title,
      content: summary ? `> ${summary}\n\n${body}` : body,
      cover_image: "/images/journal-8782.webp",
      status: "draft",
    }),
  });
  const saved = await res.json();
  console.log("inserted draft:", res.status, saved[0]?.slug ?? JSON.stringify(saved).slice(0, 120));
}
