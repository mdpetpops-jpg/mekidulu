/**
 * Minimal DeepSeek chat client shared by the support widget, the auto-reply
 * and the outreach generator.
 */

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

export function deepseekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

export type CompleteInput = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export async function complete(input: CompleteInput): Promise<string | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 25_000);

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: input.temperature ?? 0.6,
        max_tokens: input.maxTokens ?? 500,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[deepseek] upstream:", response.status, (await response.text()).slice(0, 200));
      return null;
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return payload.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error("[deepseek] request failed:", error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
