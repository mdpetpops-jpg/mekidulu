/**
 * Brevo email transport.
 *
 * Two credentials work with Brevo and both are supported here:
 *   - API key  (`xkeysib-…`)      → REST v3, header `api-key`
 *   - SMTP key (`xsmtpsib-…`)     → SMTP relay, needs BREVO_SMTP_USER
 *
 * The sender is fixed, so a compromised route cannot spoof another brand.
 */

import nodemailer from "nodemailer";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export const SENDER = {
  name: "Mekidulu",
  email: "sales@mekidulu.com",
} as const;

export type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendEmailResult =
  | { ok: true; messageId?: string; transport: "api" | "smtp" }
  | { ok: false; error: string; status?: number };

function apiKey(): string | undefined {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) return undefined;
  // `xsmtpsib-` is an SMTP relay credential, not a REST API key.
  return key.startsWith("xsmtpsib-") ? undefined : key;
}

export function brevoDiagnostics() {
  const api = process.env.BREVO_API_KEY?.trim();
  const smtp = process.env.BREVO_SMTP_KEY?.trim();
  return {
    apiKeyPrefix: api ? api.slice(0, 9) : null,
    apiKeyLength: api ? api.length : 0,
    smtpKeyPresent: Boolean(smtp),
    smtpUserPresent: Boolean(process.env.BREVO_SMTP_USER?.trim()),
    transport: brevoTransport(),
  };
}

function smtpConfig(): { user: string; pass: string } | undefined {
  const pass =
    process.env.BREVO_SMTP_KEY?.trim() ??
    (process.env.BREVO_API_KEY?.trim().startsWith("xsmtpsib-")
      ? process.env.BREVO_API_KEY?.trim()
      : undefined);
  const user = process.env.BREVO_SMTP_USER?.trim();
  return pass && user ? { user, pass } : undefined;
}

export function brevoConfigured(): boolean {
  return Boolean(apiKey() ?? smtpConfig());
}

export function brevoTransport(): "api" | "smtp" | null {
  if (apiKey()) return "api";
  if (smtpConfig()) return "smtp";
  return null;
}

async function sendViaApi(
  key: string,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: input.to, ...(input.toName ? { name: input.toName } : {}) }],
        subject: input.subject,
        textContent: input.text,
        ...(input.html ? { htmlContent: input.html } : {}),
        ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
        ...(input.headers ? { headers: input.headers } : {}),
        tags: ["mekidulu-outreach"],
      }),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => ({}))) as {
      messageId?: string;
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: body.message ?? body.code ?? `Brevo responded ${response.status}`,
      };
    }
    return { ok: true, messageId: body.messageId, transport: "api" };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { ok: false, error: aborted ? "Brevo request timed out" : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendViaSmtp(
  config: { user: string; pass: string },
  input: SendEmailInput,
): Promise<SendEmailResult> {
  try {
    const transport = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    });

    const info = await transport.sendMail({
      from: { name: SENDER.name, address: SENDER.email },
      to: input.toName ? { name: input.toName, address: input.to } : input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      ...(input.headers ? { headers: input.headers } : {}),
    });

    transport.close();
    return { ok: true, messageId: info.messageId, transport: "smtp" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `SMTP: ${message}` };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = apiKey();
  if (key) return sendViaApi(key, input);

  const smtp = smtpConfig();
  if (smtp) return sendViaSmtp(smtp, input);

  return {
    ok: false,
    error:
      "No Brevo credential: set BREVO_API_KEY (xkeysib-…) or BREVO_SMTP_KEY + BREVO_SMTP_USER.",
  };
}
