import { EmailLogTable } from "@/components/email-log-table";
import { getEmailLogs } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const logs = await getEmailLogs(200);
  const sent = logs.filter((log) => log.status === "sent").length;
  const failed = logs.length - sent;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">邮件记录</h1>
        <p className="mt-1 text-[12px] text-muted">
          共 {logs.length} 条 · 成功 {sent} · 失败 {failed} · 点击任意一行查看正文
        </p>
      </header>

      <EmailLogTable logs={logs} />
    </div>
  );
}
