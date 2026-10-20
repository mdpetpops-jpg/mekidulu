"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ArrowRight, Check, Spinner } from "@/components/icons";
import { volumeBands } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClasses =
  "h-12 w-full rounded-xl border bg-canvas px-4 text-[14px] text-ink transition-colors placeholder:text-muted/70 focus:bg-paper focus:outline-none focus:ring-4 focus:ring-brand/10";

export function WholesaleForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitting = status === "submitting";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      businessEmail: String(formData.get("businessEmail") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      estimatedVolume: String(formData.get("estimatedVolume") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      companyUrl: String(formData.get("companyUrl") ?? ""),
    };

    // Cheap client-side gate so typos never leave the browser.
    const email = payload.businessEmail.trim();
    if (!email) {
      setFieldErrors({ businessEmail: "Business email is required." });
      setFormError(null);
      formRef.current
        ?.querySelector<HTMLInputElement>("#businessEmail")
        ?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setFieldErrors({
        businessEmail: "Enter a valid business email address.",
      });
      setFormError(null);
      formRef.current
        ?.querySelector<HTMLInputElement>("#businessEmail")
        ?.focus();
      return;
    }

    setStatus("submitting");
    setFieldErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 422) {
        const data = (await response.json().catch(() => null)) as
          | { fieldErrors?: Record<string, string>; error?: string }
          | null;
        setFieldErrors(data?.fieldErrors ?? {});
        setFormError(data?.error ?? "Please check the highlighted fields.");
        setStatus("error");
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setFormError(
          data?.error ??
            "We could not send your inquiry. Please try again in a moment.",
        );
        setStatus("error");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { id?: string | null }
        | null;

      setReference(data?.id ? data.id.slice(0, 8).toUpperCase() : null);
      setSubmittedEmail(email);
      setStatus("success");
      requestAnimationFrame(() => successHeadingRef.current?.focus());
    } catch {
      setFormError(
        "Network error — check your connection and try again, or email us directly.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[1.5rem] border border-line bg-paper p-7 md:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
          <Check className="h-5 w-5" />
        </span>
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="mt-5 text-2xl font-extrabold tracking-tight text-ink focus:outline-none"
        >
          Inquiry received.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          Thanks — your request is logged against{" "}
          <span className="font-semibold text-ink">{submittedEmail}</span>. Our
          supply team will reply with pricing, MOQ and lead times.
        </p>
        {reference ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sand px-3 py-2 font-mono text-[11.5px] tracking-wider text-ink-soft">
            <span className="text-muted">Reference</span>
            {reference}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 border-t border-line/80 pt-6">
          <Link
            href="/#collections"
            className="inline-flex items-center justify-between gap-2 rounded-full bg-ink px-5 py-3 text-[13.5px] font-semibold text-canvas transition-colors hover:bg-brand-deep"
          >
            Browse the line card
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setReference(null);
              requestAnimationFrame(() =>
                formRef.current?.querySelector<HTMLInputElement>("#businessEmail")?.focus(),
              );
            }}
            className="rounded-full border border-line px-5 py-3 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-canvas"
          >
            Submit another inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-[1.5rem] border border-line bg-paper p-6 md:p-8"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-tight text-ink">
          Request pricing
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          Step 1 of 1
        </span>
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        Two fields, thirty seconds. Everything else we can work out over email.
      </p>

      {formError ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-800"
        >
          {formError}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="businessEmail"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"
          >
            Business email
            <span className="text-brand" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="businessEmail"
            name="businessEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.businessEmail)}
            aria-describedby={
              fieldErrors.businessEmail ? "businessEmail-error" : undefined
            }
            placeholder="you@company.com"
            className={`mt-2 ${inputClasses} ${
              fieldErrors.businessEmail
                ? "border-red-300 focus:border-red-500"
                : "border-line focus:border-ink"
            }`}
          />
          {fieldErrors.businessEmail ? (
            <p
              id="businessEmail-error"
              className="mt-1.5 text-[12px] font-medium text-red-700"
            >
              {fieldErrors.businessEmail}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="companyName"
            className="text-[12.5px] font-semibold text-ink"
          >
            Company name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            autoComplete="organization"
            maxLength={160}
            aria-invalid={Boolean(fieldErrors.companyName)}
            aria-describedby={
              fieldErrors.companyName ? "companyName-error" : undefined
            }
            placeholder="Company or store name"
            className={`mt-2 ${inputClasses} ${
              fieldErrors.companyName
                ? "border-red-300 focus:border-red-500"
                : "border-line focus:border-ink"
            }`}
          />
          {fieldErrors.companyName ? (
            <p
              id="companyName-error"
              className="mt-1.5 text-[12px] font-medium text-red-700"
            >
              {fieldErrors.companyName}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="estimatedVolume"
            className="text-[12.5px] font-semibold text-ink"
          >
            Estimated volume
          </label>
          <div className="relative mt-2">
            <select
              id="estimatedVolume"
              name="estimatedVolume"
              defaultValue=""
              aria-invalid={Boolean(fieldErrors.estimatedVolume)}
              aria-describedby={
                fieldErrors.estimatedVolume ? "estimatedVolume-error" : undefined
              }
              className={`h-12 w-full appearance-none rounded-xl border bg-canvas pl-4 pr-11 text-[14px] text-ink transition-colors focus:bg-paper focus:outline-none focus:ring-4 focus:ring-brand/10 ${
                fieldErrors.estimatedVolume
                  ? "border-red-300 focus:border-red-500"
                  : "border-line focus:border-ink"
              }`}
            >
              <option value="">Select a volume band</option>
              {volumeBands.map((band) => (
                <option key={band} value={band}>
                  {band} units
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8l4 4 4-4" />
            </svg>
          </div>
          {fieldErrors.estimatedVolume ? (
            <p
              id="estimatedVolume-error"
              className="mt-1.5 text-[12px] font-medium text-red-700"
            >
              {fieldErrors.estimatedVolume}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="notes"
            className="text-[12.5px] font-semibold text-ink"
          >
            Anything else?{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={2000}
            aria-invalid={Boolean(fieldErrors.notes)}
            aria-describedby={fieldErrors.notes ? "notes-error" : undefined}
            placeholder="Target market, launch date, packaging or private-label needs…"
            className={`mt-2 w-full resize-y rounded-xl border bg-canvas px-4 py-3 text-[14px] leading-relaxed text-ink transition-colors placeholder:text-muted/70 focus:bg-paper focus:outline-none focus:ring-4 focus:ring-brand/10 ${
              fieldErrors.notes
                ? "border-red-300 focus:border-red-500"
                : "border-line focus:border-ink"
            }`}
          />
          {fieldErrors.notes ? (
            <p
              id="notes-error"
              className="mt-1.5 text-[12px] font-medium text-red-700"
            >
              {fieldErrors.notes}
            </p>
          ) : null}
        </div>
      </div>

      {/* Honeypot — hidden from users and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="companyUrl">Company website</label>
        <input
          id="companyUrl"
          name="companyUrl"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 text-[14px] font-semibold text-canvas transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Spinner className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Request wholesale pricing
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted">
        We only use these details to prepare your quote. No newsletter, no
        reselling your data.
      </p>
    </form>
  );
}
