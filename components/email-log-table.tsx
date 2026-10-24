"use client";

import { useState } from "react";

export type EmailLog = {
  id: string;
  recipient_email: string;
  subject: string | null;
  email_body: string | null;
  email_type: string;
  status: string;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  outreach: "开发信",
  lead_reply: "留资回复",
  test: "测试",
};

const TYPE_STYLE: Record<string, string> = {
  outreach: "bg-brand/10 text-brand-deep",
  lead_reply: "bg-blue-50 text-blue-700",
  test: "bg-slate-100 text-slate-500",
};

export function EmailLogTable({ logs }: { logs: EmailLog[] }) {
  const [open, setOpen] = useState<EmailLog | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line/80 text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-bold">收件人</th>
              <th className="px-4 py-3 font-bold">类型</th>
              <th className="px-4 py-3 font-bold">主题</th>
              <th className="px-4 py-3 font-bold">状态</th>
              <th className="px-4 py-3 font-bold">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-muted">
                  还没有发信记录。发信成功后会自动写入 `email_logs`。
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setOpen(log)}
                  className="cursor-pointer hover:bg-canvas/60"
                >
                  <td className="px-4 py-2.5 font-medium text-ink">{log.recipient_email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_STYLE[log.email_type] ?? "bg-slate-100 text-slate-500"}`}>
                      {TYPE_LABEL[log.email_type] ?? log.email_type}
                    </span>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-ink-soft">{log.subject ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] font-semibold ${log.status === "sent" ? "text-emerald-700" : "text-red-700"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {new Date(log.created_at).toLocaleString("zh-CN", { hour12: false }).slice(0, 16)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-paper shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-line/80 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  {TYPE_LABEL[open.email_type] ?? open.email_type} · {open.status}
                </p>
                <p className="mt-1 truncate text-[13px] font-semibold text-ink">{open.subject ?? "(no subject)"}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {open.recipient_email} · {new Date(open.created_at).toLocaleString("zh-CN", { hour12: false })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label="关闭抽屉"
              >
                ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <pre className="whitespace-pre-wrap break-words font-sans text-[12.5px] leading-relaxed text-ink-soft">
                {open.email_body ?? "(empty)"}
              </pre>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
