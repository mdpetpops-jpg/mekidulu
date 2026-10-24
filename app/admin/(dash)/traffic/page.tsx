import { getTrafficSummary, getVisitorRows } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const FLAG: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", DE: "🇩🇪", FR: "🇫🇷", NL: "🇳🇱",
  ES: "🇪🇸", IT: "🇮🇹", JP: "🇯🇵", KR: "🇰🇷", CN: "🇨🇳", SG: "🇸🇬", IN: "🇮🇳",
  BR: "🇧🇷", MX: "🇲🇽", SE: "🇸🇪", PL: "🇵🇱", AE: "🇦🇪", ZA: "🇿🇦",
};

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m}m ${seconds % 60}s`;
}

function Bars({ rows, total, accent }: { rows: [string, number][]; total: number; accent: string }) {
  const max = Math.max(1, ...rows.map(([, value]) => value));
  if (rows.length === 0) return <p className="px-5 py-8 text-[12px] text-muted">暂无数据</p>;
  return (
    <ul className="space-y-3 px-5 py-4">
      {rows.map(([label, value]) => (
        <li key={label}>
          <div className="flex items-center justify-between text-[12px]">
            <span className="truncate text-ink-soft">{label}</span>
            <span className="ml-3 shrink-0 font-semibold text-ink">
              {value}
              <span className="ml-1 text-[10px] font-normal text-muted">
                {total ? Math.round((value / total) * 100) : 0}%
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand">
            <div className={`h-full rounded-full ${accent}`} style={{ width: `${(value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminTrafficPage() {
  const { total, sources, paths } = await getTrafficSummary();
  const visitors = await getVisitorRows(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">流量分析</h1>
        <p className="mt-1 text-[12px] text-muted">
          最近 {total} 次页面访问 · 访客明细 {visitors.length} 条（含国家 / 设备 / 停留时长）
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper">
          <h2 className="border-b border-line/80 px-5 py-3.5 text-[13px] font-bold text-ink">访问来源</h2>
          <Bars rows={sources} total={total} accent="bg-brand" />
        </section>

        <section className="rounded-2xl border border-line bg-paper">
          <h2 className="border-b border-line/80 px-5 py-3.5 text-[13px] font-bold text-ink">热门路径</h2>
          <Bars rows={paths} total={total} accent="bg-ink/70" />
        </section>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-3 text-[11.5px] leading-relaxed text-muted">
          还没有流量记录。middleware 会在每次页面访问时写入 `traffic_logs`；确认已执行建表 SQL，并且
          `SUPABASE_SERVICE_ROLE_KEY1` 在 Vercel 里可用，然后访问几个页面即可看到数据。
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <h2 className="border-b border-line/80 px-5 py-3.5 text-[13px] font-bold text-ink">
          访客明细（最近 100 条）
        </h2>
        <table className="w-full min-w-[760px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line/80 text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-bold">时间</th>
              <th className="px-4 py-3 font-bold">国家</th>
              <th className="px-4 py-3 font-bold">设备</th>
              <th className="px-4 py-3 font-bold">页面</th>
              <th className="px-4 py-3 font-bold">停留</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-muted">
                  暂无访客数据。前端每 15 秒上报一次，需要先执行 `0006` 建表 SQL。
                </td>
              </tr>
            ) : (
              visitors.map((row) => (
                <tr key={row.id} className="hover:bg-canvas/60">
                  <td className="px-4 py-2.5 text-muted">
                    {new Date(row.created_at).toLocaleString("zh-CN", { hour12: false }).slice(0, 16)}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {row.country ? `${FLAG[row.country] ?? ""} ${row.country}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{row.device_type ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[11.5px] text-ink-soft">{row.path}</td>
                  <td className="px-4 py-2.5 text-ink">{fmtDuration(row.duration)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
