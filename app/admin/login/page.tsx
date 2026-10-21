"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Login failed.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-paper p-7">
      <h1 className="text-xl font-extrabold tracking-tight text-ink">Command center</h1>
      <p className="mt-1.5 text-[12.5px] text-muted">Mekidulu internal dashboard.</p>

      <label htmlFor="password" className="mt-6 block text-[12px] font-semibold text-ink">
        Admin password
      </label>
      <input
        id="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="mt-2 h-11 w-full rounded-xl border border-line bg-canvas px-4 text-[14px] text-ink focus:border-ink focus:outline-none"
      />

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 h-11 w-full rounded-full bg-ink text-[13px] font-semibold text-canvas transition-colors hover:bg-brand-deep disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <Suspense fallback={<div className="text-[13px] text-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
