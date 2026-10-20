/**
 * Sending pipeline shared by the cron route and the QStash worker:
 * generate copy → Brevo → update the prospect row.
 */

import { sendEmail } from "@/lib/brevo";
import { buildColdEmail } from "@/lib/outreach/copy";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type Prospect = {
  id: string;
  email: string;
  store_name: string | null;
  website: string | null;
  status: string;
};

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mekidulu.com").replace(/\/$/, "");
}

export function unsubscribeUrl(email: string): string {
  return `${siteOrigin()}/unsubscribe?email=${encodeURIComponent(email)}`;
}

export type SendResult = { ok: boolean; error?: string };

export async function sendColdEmailTo(prospect: Prospect): Promise<SendResult> {
  const unsubscribe = unsubscribeUrl(prospect.email);
  const copy = await buildColdEmail({
    email: prospect.email,
    storeName: prospect.store_name,
    website: prospect.website,
    unsubscribeUrl: unsubscribe,
  });

  const result = await sendEmail({
    to: prospect.email,
    toName: prospect.store_name ?? undefined,
    subject: copy.subject,
    text: copy.text,
    replyTo: "sales@mekidulu.com",
    headers: {
      "List-Unsubscribe": `<${unsubscribe}>, <mailto:unsubscribe@mekidulu.com>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  const supabase = getSupabaseAdmin();

  if (result.ok) {
    const { error } = await supabase
      .from("prospects")
      .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("id", prospect.id);
    if (error) console.error("[outreach] status update failed:", error.code, error.message);
    return { ok: true };
  }

  const { error } = await supabase
    .from("prospects")
    .update({ status: "failed", last_error: result.error.slice(0, 500) })
    .eq("id", prospect.id);
  if (error) console.error("[outreach] failure record failed:", error.code, error.message);

  return { ok: false, error: result.error };
}

/** Random 3–8 minute delay, used when QStash is available. */
export function randomDelaySeconds(): number {
  return 180 + Math.floor(Math.random() * 300);
}
