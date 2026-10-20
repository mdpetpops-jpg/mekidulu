/**
 * Journal (blog) content layer.
 *
 * Posts are Markdown files in `content/journal/*.md` with YAML front matter.
 * Reading and rendering happen on the server only — this module imports
 * `node:fs`, so never reach it from a Client Component.
 */

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

export type JournalPostMeta = {
  slug: string;
  title: string;
  /** ISO date string (YYYY-MM-DD) as stored in front matter. */
  date: string;
  category: string;
  cover: string;
  summary: string;
  readingMinutes: number;
};

export type JournalPost = JournalPostMeta & { body: string };

const JOURNAL_DIR = path.join(process.cwd(), "content", "journal");

function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function parseFile(filename: string): JournalPost {
  const raw = fs.readFileSync(path.join(JOURNAL_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  const slug = String(data.slug ?? path.basename(filename, ".md"));

  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? "1970-01-01"),
    category: String(data.category ?? "Journal"),
    cover: String(data.cover ?? "/images/journal-8782.webp"),
    summary: String(data.summary ?? ""),
    readingMinutes: readingMinutes(content),
    body: content,
  };
}

let cache: JournalPost[] | null = null;

export function getAllPosts(): JournalPost[] {
  if (cache) return cache;
  if (!fs.existsSync(JOURNAL_DIR)) return [];
  cache = fs
    .readdirSync(JOURNAL_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(parseFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return cache;
}

export function getPostMeta(): JournalPostMeta[] {
  return getAllPosts().map(({ body: _body, ...meta }) => meta);
}

export function getPost(slug: string): JournalPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

export function formatJournalDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const processed = await remark().use(remarkGfm).use(html, {}).process(markdown);
  return String(processed);
}
