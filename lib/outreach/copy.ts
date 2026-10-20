/**
 * Email copy for the wholesale auto-reply and the daily cold outreach.
 *
 * DeepSeek writes the body; every generator has a deterministic fallback so a
 * provider outage degrades the wording instead of stopping the pipeline.
 */

import { complete } from "@/lib/deepseek";

const SALES_DIRECTOR = `You are the export sales director of Mekidulu, a Chinese manufacturer of heavy-duty wood cat trees (FAS-grade birch, 25 mm base plate, 10x10 cm core columns).
You write short, specific, non-pushy B2B emails in plain English. No emoji, no marketing jargon, no exclamation marks, no invented prices or lead times.
Facts you may use: low MOQ from 5 units, dropshipping supported (blind-ship cartons), OEM/ODM available, ready stock on production-proven models, factory-direct pricing, ships from China.`;

export type ThankYouInput = {
  email: string;
  companyName?: string | null;
  estimatedVolume?: string | null;
};

export async function buildThankYouEmail(input: ThankYouInput): Promise<{ subject: string; text: string }> {
  const company = input.companyName?.trim() || "your team";
  const volume = input.estimatedVolume?.trim();

  const generated = await complete({
    system: `${SALES_DIRECTOR}
Task: write a thank-you email that replies to a wholesale inquiry submitted on mekidulu.com.
Requirements: exactly 100 words (±10), English, plain text, warm but professional, no subject line in the body.
Mention that a colleague will follow up with pricing and MOQ. Do not quote prices. Sign as "Mekidulu Sales Team".`,
    user: `Inquiry details — company: ${company}; email: ${input.email}; estimated volume: ${volume ?? "not specified"}.`,
    maxTokens: 320,
    temperature: 0.5,
  });

  const fallback = `Thank you for reaching out to Mekidulu.

We have received your wholesale inquiry${input.companyName ? ` from ${company}` : ""}, and a member of our sales team will reply within one business day with pricing, MOQ and carton details for the models you are interested in.

Our production-proven lines ship from ready stock, with low MOQ and dropshipping support if you need blind-ship cartons. OEM and ODM programs are also available when you want your own finish or packaging.

If there is anything specific you would like quoted — heights, platform layouts or volume — just reply to this email and it will reach the right person.

Mekidulu Sales Team`;

  return {
    subject: "Your Mekidulu wholesale inquiry",
    text: generated ?? fallback,
  };
}

export type ColdEmailInput = {
  email: string;
  storeName?: string | null;
  website?: string | null;
  unsubscribeUrl: string;
};

export async function buildColdEmail(input: ColdEmailInput): Promise<{ subject: string; text: string }> {
  const store = input.storeName?.trim() || "your store";

  const generated = await complete({
    system: `${SALES_DIRECTOR}
Task: write a first-touch cold email to an independent pet retailer.
Requirements: 120-160 words, English, plain text, no subject line in the body, no HTML.
Open with one specific observation about the store. Position Mekidulu as a factory-direct alternative for wood cat furniture.
Must mention: low MOQ from 5 units, and dropshipping (one unit at a time) is supported.
Close with a single low-friction question. Do not quote prices. Do not promise delivery dates.
Sign as "Mekidulu Sales Team".`,
    user: `Store: ${store}. Website: ${input.website ?? "unknown"}.`,
    maxTokens: 420,
    temperature: 0.7,
  });

  const body =
    generated ??
    `Hello ${store},

I came across your store${input.website ? ` (${input.website})` : ""} and noticed you carry cat furniture — mostly carpeted towers, from what I can see.

We manufacture heavy-duty wood cat trees in China: FAS-grade birch, 25 mm base plate and 10 x 10 cm core columns, so they do not wobble under large breeds. We supply retailers and dropshippers directly from the factory, with no distributor margin in between.

Two things that matter for a store your size: MOQ starts at 5 units, and we support dropshipping one unit at a time in blind-ship cartons.

Would it help if I sent our catalogue and wholesale price list for the models closest to what you already sell?

Mekidulu Sales Team`;

  return {
    subject: `Wood cat trees for ${store} — factory direct, from 5 units`,
    text: `${body}

--
You are receiving this because your store is listed publicly as a pet retailer. Unsubscribe: ${input.unsubscribeUrl}`,
  };
}
