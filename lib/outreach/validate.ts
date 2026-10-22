/**
 * Guard rails for outbound copy.
 *
 * The model reliably drifts on hard numbers even when the prompt states them,
 * so every generated body is checked before it is allowed to leave the building.
 */

export type CopyCheck = { ok: boolean; reason?: string };

const UNIT_RE = /(\d+)\s*(?:units?|pieces?|pcs|sets?)\b/gi;
const PUNCT_RE = /(\d+)\s*(?:%|percent)\s*(?:off|discount)/gi;
const PRICE_RE = /(?:\$|usd|eur|€)\s?\d/i;

export function validateOutreachCopy(text: string): CopyCheck {
  if (!text || text.trim().length < 60) {
    return { ok: false, reason: "too short" };
  }

  if (PRICE_RE.test(text)) {
    return { ok: false, reason: "contains a price" };
  }

  // Any unit count other than the real MOQ (10) is a factual error.
  for (const match of text.matchAll(UNIT_RE)) {
    if (Number(match[1]) !== 10) {
      return { ok: false, reason: `wrong unit count: ${match[0]}` };
    }
  }

  if (PUNCT_RE.test(text)) {
    return { ok: false, reason: "invented discount" };
  }

  const unsubscribe = /unsubscribe/i.test(text);
  if (!unsubscribe) {
    return { ok: false, reason: "missing unsubscribe line" };
  }

  return { ok: true };
}

export const OUTREACH_FACTS = `HARD FACTS — do not change these numbers or invent others:
- MOQ: exactly 10 units.
- Dropshipping: supported, one unit at a time.
- Material: FAS-grade birch plywood, 25 mm base plate, 10x10 cm columns.
- No prices, no discounts, no delivery dates.
- Always end with the unsubscribe line supplied in the user message.`;

/**
 * The model truncates long URLs, so the unsubscribe line is never trusted:
 * any line it wrote is removed and the canonical one appended by code.
 */
export function withUnsubscribe(body: string, url: string): string {
  const cleaned = body
    .split("\n")
    .filter((line) => !/^\s*unsubscribe\s*:/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `${cleaned}\n\nUnsubscribe: ${url}`;
}
