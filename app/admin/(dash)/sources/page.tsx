import { importProspects, requeueFetch } from "@/app/admin/actions";
import { getOutreachRows } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const SOURCE_HINTS = [
  {
    title: "官网 /contact 页（最可靠）",
    body: "把店铺域名粘进来，系统会依次读取 /contact、/pages/contact、/about 等页面，抓取公开邮箱。这是外呼团队的真实做法。",
  },
  {
    title: "你手动找到的邮箱",
    body: "LinkedIn、Facebook 主页、行业论坛、博客作者页、Amazon 卖家信息里看到的邮箱，直接粘贴导入，标记为 manual。",
  },
  {
    title: "Google 直接搜为什么不可靠",
    body: "结果被个性化、反爬频繁、邮箱经常是缓存的旧地址。可作为人工线索来源，但不作为系统依赖。",
  },
] as const;

export default async function AdminSourcesPage() {
  const rows = await getOutreachRows(50);
  const pending = rows.filter((row) => row.fetch_status !== "fetched" && !row.email).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">邮箱获取</h1>
        <p className="mt-1 text-[12px] text-muted">
          待抓取 {pending} 条 · 每天 13:00 UTC 的开发信任务会先补全邮箱再发送
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {SOURCE_HINTS.map((hint) => (
          <div key={hint.title} className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-[12.5px] font-bold text-ink">{hint.title}</h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{hint.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="text-[13px] font-bold text-ink">批量导入</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          每行一个，支持三种写法：<code className="font-mono">店名, 网址, 邮箱</code> ·
          <code className="ml-1 font-mono">https://store.com</code>（只给网址，自动抓邮箱）·
          <code className="ml-1 font-mono">buyer@store.com</code>（只给邮箱）
        </p>

        <form action={importProspects} className="mt-4 space-y-3">
          <textarea
            name="bulk"
            rows={6}
            placeholder={"Happy Paws, https://happypaws.example, hello@happypaws.example\nhttps://another-store.example\nbuyer@third-store.example"}
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 font-mono text-[12px] leading-relaxed text-ink-soft"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select name="source" className="h-9 rounded-lg border border-line bg-canvas px-2 text-[12px]">
              <option value="manual">来源：手动</option>
              <option value="linkedin">来源：LinkedIn</option>
              <option value="forum">来源：论坛</option>
              <option value="blog">来源：博客</option>
              <option value="website">来源：官网</option>
              <option value="marketplace">来源：平台店铺</option>
            </select>
            <button type="submit" className="h-9 rounded-full bg-ink px-5 text-[12px] font-semibold text-canvas hover:bg-brand-deep">
              导入并排队
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[820px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line/80 text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-bold">店铺</th>
              <th className="px-4 py-3 font-bold">网址</th>
              <th className="px-4 py-3 font-bold">邮箱</th>
              <th className="px-4 py-3 font-bold">抓取</th>
              <th className="px-4 py-3 font-bold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-muted">
                  还没有记录，先用上面的批量导入加几条
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-canvas/60">
                  <td className="px-4 py-3 text-ink">{row.store_name || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {row.website ? row.website.replace(/^https?:\/\//, "").slice(0, 34) : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{row.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                        row.fetch_status === "fetched"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.fetch_status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.fetch_status ?? "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={requeueFetch}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:border-ink/30 hover:text-ink">
                        重新抓取
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
