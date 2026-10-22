#!/usr/bin/env node
/**
 * Grow the journal automatically: pick a topic from the backlog, ask DeepSeek
 * for a structured article, and write it as a Markdown post.
 *
 *   node scripts/generate-post.mjs --list
 *   node scripts/generate-post.mjs                 # next unused topic → draft
 *   node scripts/generate-post.mjs --publish       # write straight into content/journal
 *   node scripts/generate-post.mjs "custom topic"  # one-off topic
 *
 * Drafts land in content/journal/_drafts/ and are ignored by the site until
 * you move them up (or re-run with --publish), so nothing goes live unreviewed.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const JOURNAL = path.join(ROOT, "content", "journal");
const DRAFTS = path.join(JOURNAL, "_drafts");
const TOPICS_FILE = path.join(JOURNAL, "_topics.json");

const args = process.argv.slice(2);
const publish = args.includes("--publish");
const listOnly = args.includes("--list");
const custom = args.find((a) => !a.startsWith("--"));

const COVERS = {
  "Feline Engineering": "/images/journal-scratching.webp",
  "Maintenance Guide": "/images/journal-carpet.webp",
  "Design Insights": "/images/journal-8782.webp",
  "Wholesale & Logistics": "/images/wood-cat-tree.webp",
  "Home Tips": "/images/wood-cat-tree.webp",
};

const usedSlugs = () =>
  new Set(
    fs
      .readdirSync(JOURNAL)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, "")),
  );

function loadTopics() {
  const raw = JSON.parse(fs.readFileSync(TOPICS_FILE, "utf8"));
  return raw.topics ?? [];
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

async function ask(topic, category, existing) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is required.");

  const system = `You are the technical writer for Mekidulu, a Chinese manufacturer of heavy-duty wood cat furniture.
Write for an audience of independent pet retailers and serious cat owners.

RULES
- 700-900 words, English, Markdown only (no front matter, no code fences around the whole answer).
- Structure: opening paragraph, 3-5 "##" sections, at least one bullet list, one "## FAQ" with 3 Q&A pairs (question as "### " heading).
- Engineer's voice: specific numbers, mechanisms, trade-offs. No marketing adjectives, no emoji.
- Facts you may use: FAS-grade birch plywood; 25 mm reinforced base plate; 10 x 10 cm solid birch core columns; natural sisal; steel anti-topple wall anchor; low MOQ from 10 units; dropshipping supported; OEM/ODM available; manufactured in China.
- Never invent load ratings, prices, lead times or test data.
- Mention Mekidulu naturally once or twice, and link to /manuals or /shop in plain Markdown at most twice.
- Do not mention competitors by name.`;

  const user = `Topic: ${topic}
Category: ${category}

Existing articles on the site (do not duplicate them, and you may reference one by title):
${existing.map((t) => `- ${t}`).join("\n") || "- (none yet)"}`;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.6,
      max_tokens: 2200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) throw new Error(`DeepSeek ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

function summarise(markdown) {
  const firstParagraph = markdown
    .split("\n\n")
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#") && !block.startsWith("-"));
  const text = (firstParagraph ?? "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "");
  return text.length > 200 ? `${text.slice(0, 197).trim()}…` : text;
}

async function main() {
  const topics = loadTopics();
  const used = usedSlugs();

  if (listOnly) {
    console.log("Backlog:");
    for (const t of topics) {
      console.log(` ${used.has(t.slug) ? "✓" : " "} ${t.slug}  — ${t.topic}`);
    }
    return;
  }

  let topic;
  if (custom) {
    topic = { slug: slugify(custom), topic: custom, category: "Design Insights" };
  } else {
    topic = topics.find((t) => !used.has(t.slug));
  }

  if (!topic) {
    console.log("Backlog is empty. Add topics to content/journal/_topics.json.");
    return;
  }

  console.log(`Generating: ${topic.topic}`);
  const markdown = await ask(topic.topic, topic.category, [...used]);
  if (!markdown) throw new Error("Empty response from DeepSeek.");

  const words = markdown.split(/\s+/).filter(Boolean).length;
  const frontMatter = [
    "---",
    `slug: ${topic.slug}`,
    `title: "${topic.topic.replace(/"/g, '\\"')}"`,
    `date: "${new Date().toISOString().slice(0, 10)}"`,
    `category: "${topic.category}"`,
    `cover: "${COVERS[topic.category] ?? "/images/journal-8782.webp"}"`,
    `summary: "${summarise(markdown).replace(/"/g, '\\"')}"`,
    "---",
    "",
  ].join("\n");

  const targetDir = publish ? JOURNAL : DRAFTS;
  fs.mkdirSync(targetDir, { recursive: true });
  const file = path.join(targetDir, `${topic.slug}.md`);
  fs.writeFileSync(file, frontMatter + markdown + "\n", "utf8");

  console.log(`Wrote ${path.relative(ROOT, file)} (${words} words).`);
  if (!publish) {
    console.log("It is a draft. Review it, then move it to content/journal/ or re-run with --publish.");
  } else {
    console.log("Published. Commit + push and it appears on /blog and in sitemap.xml.");
  }
}

main().catch((error) => {
  console.error(`FAILED: ${error.message}`);
  process.exit(1);
});
