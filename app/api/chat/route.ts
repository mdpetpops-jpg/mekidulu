import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSystemPrompt } from "@/lib/chat/prompt";
import { manualFiles, manualPdfPath } from "@/lib/manuals";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_TOTAL_CHARS = 6000;
const UPSTREAM_TIMEOUT_MS = 25_000;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1500),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  locale: z.string().trim().max(16).optional(),
});

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    const ip = first?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Mention of a model code lets the UI show the matching manual link. */
function detectManual(text: string) {
  const lowered = text.toLowerCase();
  const match = manualFiles.find((manual) =>
    lowered.includes(manual.model.toLowerCase()) ||
    lowered.includes(manual.id.toLowerCase()),
  );
  return match
    ? { model: match.model, url: manualPdfPath(match.id) }
    : undefined;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError("Expected a JSON request body.", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Malformed JSON body.", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Send between 1 and 12 short messages.", 422);
  }

  const { messages, locale } = parsed.data;

  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return jsonError("That conversation is too long. Start a new chat.", 413);
  }

  const limit = rateLimit(`chat:${clientIp(request)}`);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "You have sent a lot of messages. Please wait a moment.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    console.error("[api/chat] DEEPSEEK_API_KEY is not configured.");
    return jsonError(
      "Support chat is being set up. Please use the wholesale form and we will reply by email.",
      503,
    );
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const manual = lastUserMessage ? detectManual(lastUserMessage.content) : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.35,
        max_tokens: 600,
        messages: [
          { role: "system", content: buildSystemPrompt(locale) },
          ...messages,
        ],
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 300);
      console.error("[api/chat] upstream error:", upstream.status, detail);
      return jsonError(
        "The assistant is unavailable right now. Please use the wholesale form.",
        upstream.status === 429 ? 429 : 502,
      );
    }

    const payload = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = payload.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return jsonError("The assistant returned an empty answer. Please retry.", 502);
    }

    return NextResponse.json({ ok: true, reply, manual });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[api/chat] request failed:", aborted ? "timeout" : error);
    return jsonError(
      aborted
        ? "The assistant took too long to answer. Please try again."
        : "The assistant is unavailable right now.",
      aborted ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
