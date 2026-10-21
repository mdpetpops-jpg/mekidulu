import Link from "next/link";

import { getRecentAiErrors, getRecentLeads, getStats } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

function Card({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-[32px] font-extrabold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-[11px] text-muted">{note}</p>
    </div>
  );
}

function time(value: string): string {
  return new Date(value).toLocaleString("zh-CN", { hour12: false }).slice(0, 16);
}

export default async function AdminDashboard() {
  const [stats, leads, errors] = await Promise.all([getStats(), getRecentLeads(5), getRecentAiErrors(5)]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">仪表盘</h1>
        <p className="mt-1 text-[12px] text-muted">今日数据（UTC）· 自动刷新</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="今日线索" value={stats.leadsToday} note="留资表单提交数" />
        <Card label="今日发信" value={stats.sentToday} note="开发信已发送" />
        <Card label="博客阅读" value={stats.blogReads} note="/blog 页面访问" />
        <Card label="今日访客" value={stats.visitors} note="按 IP 哈希去重" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line/80 px-5 py-3.5">
            <h2 className="text-[13px] font-bold text-ink">最近 5 条线索</h2>
            <Link href="/admin/leads" className="text-[11px] font-semibold text-brand-deep hover:underline">
              全部 →
            </Link>
          </div>
          <ul className="divide-y divide-line/70">
            {leads.length === 0 ? (
              <li className="px-5 py-6 text-[12px] text-muted">暂无线索（或 leads 表尚未补 email/volume 字段）</li>
            ) : (
              leads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{lead.email}</p>
                    <p className="truncate text-[11px] text-muted">
                      {lead.company_name || "—"} · {lead.volume || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted">{time(lead.created_at)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line/80 px-5 py-3.5">
            <h2 className="text-[13px] font-bold text-ink">最近 5 条 AI 报错</h2>
            <Link href="/admin/ai" className="text-[11px] font-semibold text-brand-deep hover:underline">
              调度中心 →
            </Link>
          </div>
          <ul className="divide-y divide-line/70">
            {errors.length === 0 ? (
              <li className="px-5 py-6 text-[12px] text-muted">没有报错记录</li>
            ) : (
              errors.map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-red-700">
                      {log.scenario}
                    </span>
                    <span className="text-[10px] text-muted">{time(log.created_at)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-soft">
                    {log.output_response || "—"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
