"use client";

import { useEffect, useState } from "react";

type State = "idle" | "sending" | "done" | "error";

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("email");
    if (param) setEmail(param);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    setState("sending");
    setError(null);

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Could not process that address.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error — please try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-line bg-paper p-6">
        <p className="text-[15px] font-semibold text-ink">You are unsubscribed.</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {email} will not receive further outreach from Mekidulu. If you still
          want wholesale information, reply to any earlier email or use the{" "}
          <a href="/wholesale" className="font-semibold text-ink underline underline-offset-2">
            wholesale form
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-paper p-6">
      <label htmlFor="unsubscribe-email" className="text-[12.5px] font-semibold text-ink">
        Email address
      </label>
      <input
        id="unsubscribe-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@store.com"
        className="mt-2 h-12 w-full rounded-xl border border-line bg-canvas px-4 text-[14px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none"
      />
      {error ? (
        <p role="alert" className="mt-3 text-[12px] font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-canvas transition-colors hover:bg-brand-deep disabled:opacity-60"
      >
        {state === "sending" ? "Removing…" : "Unsubscribe"}
      </button>
    </form>
  );
}
