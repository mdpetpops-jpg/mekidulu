import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteBlogPost, saveBlogPost, setBlogStatus } from "@/app/admin/actions";
import { getBlogRow } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogRow(id);
  if (!post) notFound();

  const published = post.status === "published";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/blog" className="text-[11px] text-muted hover:text-ink">
            ← 返回博客管理
          </Link>
          <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-ink">{post.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
              published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {post.status}
          </span>
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-ink-soft hover:border-ink/30"
          >
            预览 ↗
          </a>
        </div>
      </header>

      <form action={saveBlogPost} className="space-y-4 rounded-2xl border border-line bg-paper p-5">
        <input type="hidden" name="id" value={post.id} />

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="title" className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              标题
            </label>
            <input
              id="title"
              name="title"
              defaultValue={post.title}
              className="mt-1.5 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] text-ink"
            />
          </div>
          <div>
            <label htmlFor="slug" className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={post.slug}
              className="mt-1.5 h-10 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-[12px] text-ink"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="cover_image" className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              封面图路径（可选）
            </label>
            <input
              id="cover_image"
              name="cover_image"
              defaultValue={post.cover_image ?? ""}
              placeholder="/images/journal-8782.webp"
              className="mt-1.5 h-10 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-[12px] text-ink"
            />
          </div>
          <div>
            <label htmlFor="target_audience" className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              受众分类
            </label>
            <select
              id="target_audience"
              name="target_audience"
              defaultValue={post.target_audience === "B" ? "B" : "C"}
              className="mt-1.5 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[12px] text-ink"
            >
              <option value="C">C 端 — 流量文章</option>
              <option value="B">B 端 — 买手文章</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="content" className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Markdown 正文
          </label>
          <textarea
            id="content"
            name="content"
            defaultValue={post.content}
            rows={22}
            className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 font-mono text-[12px] leading-relaxed text-ink-soft"
          />
        </div>

        <button type="submit" className="h-10 rounded-full bg-ink px-6 text-[12.5px] font-semibold text-canvas hover:bg-brand-deep">
          保存
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <form action={setBlogStatus}>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="status" value={published ? "draft" : "published"} />
          <button
            type="submit"
            className={`h-10 rounded-full px-6 text-[12.5px] font-semibold ${
              published ? "border border-line text-ink hover:bg-canvas" : "bg-brand text-canvas hover:bg-brand-deep"
            }`}
          >
            {published ? "撤回为草稿" : "发布到 /blog"}
          </button>
        </form>

        <form action={deleteBlogPost}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="h-10 rounded-full border border-red-200 px-5 text-[12px] font-semibold text-red-700 hover:bg-red-50">
            删除
          </button>
        </form>
      </div>
    </div>
  );
}
