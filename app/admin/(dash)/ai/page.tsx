import { savePrompt } from "@/app/admin/actions";
import { getAiLogs, getAiUsage, getPrompts } from "@/lib/admin/data";
import { DEFAULT_PROMPTS } from "@/lib/ai";

export const dynamic = "force-dynamic";

const SCENARIOS = ["outreach_email", "blog_generation", "support_chat", "support_reply", "lead_thankyou"];

export default async function AdminAiPage() {
  const [prompts, logs, usage] = await Promise.all([getPrompts(), getAiLogs(30), getAiUsage()]);
  const known = new Set(prompts.map((prompt) => prompt.scenario));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">AI 调度中心</h1>
        <p className="mt-1 text-[12px] text-muted">
          提示词可在线修改（写入 `ai_prompts`）· 每次调用都会记入 `ai_logs`
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">今日调用</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{usage.todayCalls}</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">今日 Token</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{usage.todayTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">累计调用</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{usage.totalCalls}</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">累计 Token</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{usage.totalTokens.toLocaleString()}</p>
        </div>
      </section>

      {usage.byScenario.length > 0 ? (
        <section className="rounded-2xl border border-line bg-paper">
          <h2 className="border-b border-line/80 px-5 py-3.5 text-[13px] font-bold text-ink">按场景统计</h2>
          <ul className="divide-y divide-line/70">
            {usage.byScenario.map(([scenario, stats]) => (
              <li key={scenario} className="flex items-center justify-between px-5 py-2.5 text-[12px]">
                <span className="font-mono text-[11.5px] text-ink">{scenario}</span>
                <span className="text-muted">
                  {stats.calls} 次 · {stats.tokens.toLocaleString()} tokens
                  {stats.errors > 0 ? <span className="ml-2 text-red-700">· {stats.errors} 错误</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-[13px] font-bold text-ink">提示词</h2>

        {prompts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[12px] leading-relaxed text-muted">
              还没有提示词记录，系统会使用内置默认值。执行建表 SQL 后，默认提示词会被写入
              `ai_prompts`，之后可在这里编辑。
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {prompts.map((prompt) => (
            <form key={prompt.id} action={savePrompt} className="rounded-2xl border border-line bg-paper p-4">
              <input type="hidden" name="id" value={prompt.id} />
              <div className="flex items-center justify-between gap-3">
                <input
                  name="scenario"
                  defaultValue={prompt.scenario}
                  className="h-8 w-40 rounded-lg border border-line bg-canvas px-2 font-mono text-[11.5px]"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-muted">
                  <input type="checkbox" name="is_active" defaultChecked={prompt.is_active} />
                  启用
                </label>
              </div>
              <textarea
                name="prompt_content"
                defaultValue={prompt.prompt_content}
                rows={10}
                className="mt-3 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-[11.5px] leading-relaxed text-ink-soft"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  更新于 {new Date(prompt.updated_at).toLocaleString("zh-CN", { hour12: false }).slice(0, 16)}
                </span>
                <button type="submit" className="h-8 rounded-full bg-ink px-4 text-[11.5px] font-semibold text-canvas hover:bg-brand-deep">
                  保存
                </button>
              </div>
            </form>
          ))}

          <form action={savePrompt} className="rounded-2xl border border-dashed border-line bg-paper/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">新增提示词</p>
            <select name="scenario" className="mt-3 h-8 w-full rounded-lg border border-line bg-canvas px-2 text-[11.5px]">
              {SCENARIOS.filter((scenario) => !known.has(scenario)).map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenario}
                </option>
              ))}
            </select>
            <textarea
              name="prompt_content"
              rows={6}
              placeholder={DEFAULT_PROMPTS[SCENARIOS.find((s) => !known.has(s)) ?? "support_reply"]}
              className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-[11.5px] text-ink-soft"
            />
            <label className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
              <input type="checkbox" name="is_active" defaultChecked />
              启用
            </label>
            <button type="submit" className="mt-3 h-8 w-full rounded-full border border-line text-[11.5px] font-semibold text-ink hover:bg-canvas">
              添加
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-bold text-ink">调用日志（最近 30 条）</h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {logs.length === 0 ? (
            <p className="px-5 py-8 text-[12px] text-muted">暂无调用记录</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {logs.map((log) => (
                <li key={log.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded-full bg-sand px-2 py-0.5 font-bold uppercase tracking-[0.08em] text-ink-soft">
                      {log.scenario}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-[0.08em] ${
                        log.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-muted">{log.tokens_used ?? 0} tokens</span>
                    <span className="text-muted">
                      {new Date(log.created_at).toLocaleString("zh-CN", { hour12: false }).slice(0, 16)}
                    </span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer list-none text-[11px] font-semibold text-brand-deep">
                      对比 Input / Output
                    </summary>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <pre className="max-h-52 overflow-auto rounded-lg bg-canvas p-2.5 font-mono text-[10.5px] leading-relaxed text-ink-soft">
                        {log.input_prompt ?? "—"}
                      </pre>
                      <pre className="max-h-52 overflow-auto rounded-lg bg-canvas p-2.5 font-mono text-[10.5px] leading-relaxed text-ink-soft">
                        {log.output_response ?? "—"}
                      </pre>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
