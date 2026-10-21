/**
 * AI runner for the admin command center.
 *
 * Every call resolves its prompt from `ai_prompts` (editable in /admin/ai),
 * falls back to a built-in default, and writes a row into `ai_logs` so the
 * dashboard can surface failures.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const DEFAULT_PROMPTS: Record<string, string> = {
  outreach_email: `You are the export sales director of Mekidulu, a Chinese manufacturer of heavy-duty birch cat furniture.
Write a 90-110 word plain-text B2B cold email to an independent pet retailer.
Mention: low MOQ from 5 units, dropshipping supported, factory-direct pricing. One low-friction closing question. No prices, no delivery promises, no emoji.
Return only the email body.`,
  blog_generation: `You are a senior pet-industry blogger writing for Mekidulu.
Given a real question Western cat owners are discussing online, write a ~500 word English Q&A blog post.
Include an SEO title line, a short summary line, then Markdown body with ## sections and a short FAQ.
Naturally mention Mekidulu's heavy-duty birch cat trees (25 mm base plate, 10x10 cm columns, wipe-clean wood) without hard selling.`,
  support_reply: `You are a structural engineer at Mekidulu with 10 years of experience in heavy-duty cat trees.
Answer briefly and concretely about load, stability, anti-slip and wholesale. Never invent numbers.`,
  lead_thankyou: `You are the export sales director of Mekidulu. Write a 100-word English thank-you email replying to a wholesale inquiry. Warm, specific, no prices. Sign as "Mekidulu Sales Team".`,
};

export type AiResult = {
  ok: boolean;
  text: string;
  tokens: number;
  error?: string;
};

export async function getPrompt(scenario: string): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("ai_prompts")
      .select("prompt_content")
      .eq("scenario", scenario)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1);
    const content = (data?.[0] as { prompt_content?: string } | undefined)?.prompt_content;
    if (content?.trim()) return content.trim();
  } catch {
    // table may not exist yet — fall through to defaults
  }
  return DEFAULT_PROMPTS[scenario] ?? DEFAULT_PROMPTS.support_reply;
}

export async function runAi(options: {
  scenario: string;
  input: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<AiResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const system = await getPrompt(options.scenario);
  const maxTokens = Math.min(options.maxTokens ?? 500, 1600);

  if (!apiKey) {
    return { ok: false, text: "", tokens: 0, error: "DEEPSEEK_API_KEY missing" };
  }

  const started = Date.now();
  let text = "";
  let tokens = 0;
  let error: string | undefined;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: options.temperature ?? 0.6,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: options.input },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      error = `DeepSeek ${response.status}: ${(await response.text()).slice(0, 200)}`;
    } else {
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };
      text = payload.choices?.[0]?.message?.content?.trim() ?? "";
      tokens = payload.usage?.total_tokens ?? 0;
      if (!text) error = "Empty response";
    }
  } catch (exception) {
    error = exception instanceof Error ? exception.message : String(exception);
  }

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("ai_logs").insert({
      scenario: options.scenario,
      input_prompt: options.input.slice(0, 4000),
      output_response: (text || error || "").slice(0, 8000),
      tokens_used: tokens,
      status: error ? "error" : "success",
      duration_ms: Date.now() - started,
    });
  } catch {
    // logging must never break the caller
  }

  return { ok: !error, text, tokens, error };
}
