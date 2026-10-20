"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ArrowUpRight, Close, Spinner } from "@/components/icons";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ManualLink = { model: string; url: string };

const QUICK_PROMPTS = [
  "Can the 8782 hold two Maine Coons?",
  "How do I stop it wobbling on carpet?",
  "What is your wholesale MOQ?",
] as const;

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<ManualLink | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const userMessage: ChatMessage = { id: newId(), role: "user", content };
    const withUser = [...messages, userMessage];

    setMessages(withUser);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: withUser.slice(-10).map(({ role, content: body }) => ({
            role,
            content: body,
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; reply?: string; error?: string; manual?: ManualLink }
        | null;

      if (!response.ok || !data?.ok || !data.reply) {
        setError(
          data?.error ??
            "The assistant is unavailable right now. Please use the wholesale form.",
        );
        return;
      }

      setMessages((current) => [
        ...current,
        { id: newId(), role: "assistant", content: data.reply as string },
      ]);
      if (data.manual) setManual(data.manual);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Mekidulu support chat"
          className="flex h-[min(34rem,75vh)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_30px_80px_-40px_rgba(16,22,19,0.55)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-line/80 bg-canvas px-4 py-3.5">
            <div>
              <p className="text-[13px] font-bold tracking-tight text-ink">
                Ask an engineer
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted">
                Structural questions · EN / 中文 / ES / DE
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
            >
              <Close className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">
                  10 years building heavy-duty cat trees. Ask about load,
                  stability, assembly or wholesale — I answer in your language.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      className="rounded-xl border border-line bg-canvas px-3 py-2 text-left text-[11.5px] font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-md bg-ink text-canvas"
                      : "rounded-bl-md bg-sand text-ink"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-sand px-3.5 py-2.5 text-[11.5px] text-muted">
                  <Spinner className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </span>
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] leading-relaxed text-red-800"
              >
                {error}
              </p>
            ) : null}

            {manual ? (
              <a
                href={manual.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-[10.5px] font-semibold text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
              >
                {manual.model} assembly PDF
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="border-t border-line/80 bg-canvas px-3 py-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1500}
                placeholder="Ask about load, assembly or MOQ…"
                aria-label="Message"
                className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[12.5px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-ink px-4 text-[12px] font-semibold text-canvas transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[9.5px] text-muted">
              <span>Guidance only — the manual PDF is authoritative.</span>
              <Link
                href="/wholesale"
                className="font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Wholesale form
              </Link>
            </div>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="inline-flex items-center gap-2.5 rounded-full bg-ink px-5 py-3.5 text-[13px] font-semibold text-canvas shadow-[0_18px_40px_-18px_rgba(16,22,19,0.7)] transition-colors hover:bg-brand-deep"
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        {open ? "Hide chat" : "Ask an engineer"}
      </button>
    </div>
  );
}
