import { getAllLeads } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

function time(value: string): string {
  return new Date(value).toLocaleString("zh-CN", { hour12: false }).slice(0, 16);
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-brand/10 text-brand-deep",
  contacted: "bg-amber-50 text-amber-700",
  qualified: "bg-blue-50 text-blue-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-slate-100 text-slate-500",
};

export default async function AdminLeadsPage() {
  const leads = await getAllLeads(200);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">线索池</h1>
        <p className="mt-1 text-[12px] text-muted">留资表单提交记录 · 共 {leads.length} 条（最多显示 200）</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line/80 text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">公司</th>
              <th className="px-4 py-3 font-bold">体量</th>
              <th className="px-4 py-3 font-bold">状态</th>
              <th className="px-4 py-3 font-bold">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-muted">
                  暂无线索
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-canvas/60">
                  <td className="px-4 py-3 font-medium text-ink">{lead.email}</td>
                  <td className="px-4 py-3 text-ink-soft">{lead.company_name || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{lead.volume || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                        STATUS_STYLE[lead.status] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {lead.status || "new"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{time(lead.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
