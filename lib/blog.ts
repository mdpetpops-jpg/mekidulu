/**
 * Blog content: database-first, with the legacy Markdown files kept readable.
 *
 * Published posts live in `blog_posts` (managed from /admin/blog). The five
 * articles migrated from the old static site still live in
 * `content/journal/*.md`; both are merged here so nothing disappears while the
 * database fills up.
 */

import { getAllPosts as getFilePosts, formatJournalDate, renderMarkdown } from "@/lib/journal";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BlogListItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  cover: string;
  readingMinutes: number;
  source: "db" | "file";
};

export type BlogPostContent = BlogListItem & { content: string };

type DbRow = {
  slug: string;
  title: string;
  content: string;
  cover_image: string | null;
  created_at: string;
};

const DEFAULT_COVER = "/images/journal-8782.webp";

function firstParagraph(markdown: string): string {
  const block = markdown
    .split("\n\n")
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#") && !part.startsWith("-") && !part.startsWith(">"));
  const text = (block ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

async function publishedRows(): Promise<DbRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, content, cover_image, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as DbRow[];
  } catch {
    return [];
  }
}

function rowToItem(row: DbRow): BlogListItem {
  const content = row.content ?? "";
  return {
    slug: row.slug,
    title: row.title,
    summary: firstParagraph(content),
    category: "Journal",
    date: (row.created_at ?? new Date().toISOString()).slice(0, 10),
    cover: row.cover_image || DEFAULT_COVER,
    readingMinutes: readingMinutes(content),
    source: "db",
  };
}

export async function listPublishedPosts(): Promise<BlogListItem[]> {
  const [rows, files] = await Promise.all([publishedRows(), Promise.resolve(getFilePosts())]);

  const dbItems = rows.map(rowToItem);
  const fileSlugs = new Set(dbItems.map((item) => item.slug));
  const fileItems: BlogListItem[] = files
    .filter((post) => !fileSlugs.has(post.slug))
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      category: post.category,
      date: post.date,
      cover: post.cover,
      readingMinutes: post.readingMinutes,
      source: "file" as const,
    }));

  return [...dbItems, ...fileItems].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPublishedPost(slug: string): Promise<BlogPostContent | undefined> {
  const rows = await publishedRows();
  const row = rows.find((entry) => entry.slug === slug);
  if (row) {
    return { ...rowToItem(row), content: row.content ?? "" };
  }

  const file = getFilePosts().find((post) => post.slug === slug);
  if (!file) return undefined;

  return {
    slug: file.slug,
    title: file.title,
    summary: file.summary,
    category: file.category,
    date: file.date,
    cover: file.cover,
    readingMinutes: file.readingMinutes,
    source: "file",
    content: file.body,
  };
}

export { formatJournalDate, renderMarkdown };
