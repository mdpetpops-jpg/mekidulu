import Link from "next/link";

import { createBlogPost, generateBlogDraftAction } from "@/app/admin/actions";
import { getBlogRows, type BlogRow } from "@/lib/admin/data";
import { getAllPosts } from "@/lib/journal";

export const dynamic = "force-dynamic";

const BADGE: Record<string, string> = {
  B: "bg-blue-50 text-blue-700 ring-blue-200",
  C: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const TABS = [
  { key: "all", label: "全部" },
  { key: "B", label: "B端文章(买手)" },
  { key: "C", label: "C端文章(流量)" },
] as const;

function AudienceTag({ audience }: { audience: string | null }) {
  const key = audience === "B" ? "B" : "C";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] ring-1 ${BADGE[key]}`}
    >
      {key === "B" ? "B 买手" : "C 流量"}
    </span>
  );
}

function Row({ row }: { row: BlogRow }) {
  const published = row.status === "published";
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas/60">
      <div className="flex min-w-0 items-center gap-2.5">
        <AudienceTag audience={row.target_audience} />
        <div className="min-w-0">
          <Link href={`/admin/blog/${row.id}`} className="block truncate text-[13px] font-semibold text-ink hover:text-brand-deep">
            {row.title}
          </Link>
          <p className="truncate font-mono text-[10.5px] text-muted">
            /blog/{row.slug} · {new Date(row.created_at).toLocaleDateString("zh-CN")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] ${
            published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {published ? "published" : "draft"}
        </span>
        <Link href={`/admin/blog/${row.id}`} className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:border-ink/30 hover:text-ink">
          编辑
        </Link>
      </div>
    </li>
  );
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>;
}) {
  const { audience } = await searchParams;
  const active = audience === "B" || audience === "C" ? audience : "all";

  const allRows = await getBlogRows();
  const rows = active === "all" ? allRows : allRows.filter((row) => (row.target_audience ?? "C") === active);

  const drafts = rows.filter((row) => row.status !== "published");
  const published = rows.filter((row) => row.status === "published");
  const legacy = getAllPosts();

  const countB = allRows.filter((row) => row.target_audience === "B").length;
  const countC = allRows.filter((row) => (row.target_audience ?? "C") === "C").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">博客管理</h1>
          <p className="mt-1 text-[12px] text-muted">
            草稿箱 {drafts.length} · 已发布 {published.length} · B端 {countB} / C端 {countC} · 旧站文件文章 {legacy.length}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={generateBlogDraftAction}>
            <button
              type="submit"
              className="h-9 rounded-full border border-line px-4 text-[12px] font-semibold text-ink hover:bg-canvas"
            >
              ⚡ 立即生成一篇
            </button>
          </form>
          <form action={createBlogPost}>
            <button type="submit" className="h-9 rounded-full bg-ink px-5 text-[12px] font-semibold text-canvas hover:bg-brand-deep">
              + 新建文章
            </button>
          </form>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const selected = active === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/admin/blog" : `/admin/blog?audience=${tab.key}`}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                selected
                  ? "bg-ink text-canvas"
                  : "border border-line text-ink-soft hover:border-ink/30 hover:text-ink"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${selected ? "text-canvas/70" : "text-muted"}`}>
                {tab.key === "all" ? allRows.length : tab.key === "B" ? countB : countC}
              </span>
            </Link>
          );
        })}
      </nav>

      <section className="rounded-2xl border border-line bg-paper">
        <h2 className="border-b border-line/80 px-4 py-3 text-[13px] font-bold text-ink">草稿箱</h2>
        {drafts.length === 0 ? (
          <p className="px-4 py-6 text-[12px] text-muted">
            没有草稿。每天 12:00（UTC）的 cron 会自动写一篇：双日 C 端（引流），单日 B 端（买手）。
          </p>
        ) : (
          <ul className="divide-y divide-line/70">
            {drafts.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper">
        <h2 className="border-b border-line/80 px-4 py-3 text-[13px] font-bold text-ink">已发布</h2>
        {published.length === 0 ? (
          <p className="px-4 py-6 text-[12px] text-muted">还没有从后台发布的文章。</p>
        ) : (
          <ul className="divide-y divide-line/70">
            {published.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper/60">
        <h2 className="border-b border-line/80 px-4 py-3 text-[13px] font-bold text-ink">
          旧站文章（文件管理，只读）
        </h2>
        <p className="px-4 pt-3 text-[11px] leading-relaxed text-muted">
          这 {legacy.length} 篇在 <code className="font-mono">content/journal/*.md</code>，线上正常显示；要改就到 GitHub 改文件。
        </p>
        <ul className="divide-y divide-line/70">
          {legacy.map((post) => (
            <li key={post.slug} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="truncate text-[12px] text-ink-soft">{post.title}</span>
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[11px] text-brand-deep hover:underline">
                预览 ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
