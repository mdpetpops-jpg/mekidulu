import { setOutreachReply } from "@/app/admin/actions";
import { getOutreachRows } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

function pill(value: string | null, map: Record<string, string>) {
  const key = (value ?? "pending").toLowerCase();
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${map[key] ?? "bg-slate-100 text-slate-500"}`}>
      {key}
    </span>
  );
}

const FETCH_MAP: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  fetched: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-700",
};
const SEND_MAP: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  bounced: "bg-amber-50 text-amber-700",
};
const REPLY_MAP: Record<string, string> = {
  none: "bg-slate-100 text-slate-500",
  waiting: "bg-slate-100 text-slate-500",
  replied: "bg-brand/10 text-brand-deep",
  interested: "bg-emerald-50 text-emerald-700",
  not_interested: "bg-slate-100 text-slate-500",
};

export default async function AdminOutreachPage() {
  const rows = await getOutreachRows(200);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">开发信追踪</h1>
        <p className="mt-1 text-[12px] text-muted">抓取 / 发送 / 回复状态 · 点击行尾查看回复内容</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[900px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line/80 text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-bold">店铺</th>
              <th className="px-4 py-3 font-bold">邮箱</th>
              <th className="px-4 py-3 font-bold">抓取</th>
              <th className="px-4 py-3 font-bold">发送</th>
              <th className="px-4 py-3 font-bold">回复</th>
              <th className="px-4 py-3 font-bold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[12px] text-muted">
                  暂无记录（先用 SQL 里的示例插入几条，或等抓取任务写入）
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-canvas/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.store_name || "—"}</p>
                    {row.website ? (
                      <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted hover:underline">
                        {row.website.replace(/^https?:\/\//, "").slice(0, 30)}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{row.email}</td>
                  <td className="px-4 py-3">{pill(row.fetch_status, FETCH_MAP)}</td>
                  <td className="px-4 py-3">{pill(row.send_status, SEND_MAP)}</td>
                  <td className="px-4 py-3">{pill(row.reply_status, REPLY_MAP)}</td>
                  <td className="px-4 py-3">
                    <details className="group">
                      <summary className="cursor-pointer list-none rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:border-ink/30 hover:text-ink">
                        查看 / 标记
                      </summary>
                      <form action={setOutreachReply} className="mt-3 w-64 space-y-2 rounded-xl border border-line bg-canvas p-3">
                        <input type="hidden" name="id" value={row.id} />
                        <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                          回复状态
                        </label>
                        <select
                          name="reply_status"
                          defaultValue={row.reply_status ?? "none"}
                          className="h-9 w-full rounded-lg border border-line bg-paper px-2 text-[12px]"
                        >
                          <option value="none">none</option>
                          <option value="waiting">waiting</option>
                          <option value="replied">replied</option>
                          <option value="interested">interested</option>
                          <option value="not_interested">not_interested</option>
                        </select>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                          回复内容
                        </label>
                        <textarea
                          name="reply_content"
                          rows={4}
                          defaultValue={row.reply_content ?? ""}
                          className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[12px]"
                          placeholder="粘贴客户回复…"
                        />
                        <button
                          type="submit"
                          className="h-9 w-full rounded-full bg-ink text-[12px] font-semibold text-canvas hover:bg-brand-deep"
                        >
                          保存
                        </button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
