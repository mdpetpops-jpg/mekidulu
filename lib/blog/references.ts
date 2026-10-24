/**
 * Citation pool.
 *
 * Every URL here was fetched and returned HTTP 200 — no invented references.
 * C articles lead with veterinary/behaviour sources; B articles lead with
 * industry/trade data. Both get real Markdown links at the bottom.
 */

export type Reference = { label: string; url: string; audience: "C" | "B" };

export const REFERENCES: Reference[] = [
  {
    label: "AVMA — U.S. pet ownership and demographics",
    url: "https://www.avma.org/resources-tools/reports-statistics/ownership-and-demographics",
    audience: "C",
  },
  {
    label: "AVMA — Cat owners resource centre",
    url: "https://www.avma.org/resources-tools/pet-owners/cat-owners",
    audience: "C",
  },
  {
    label: "APPA — Pet industry market size and trends",
    url: "https://americanpetproducts.org/industry-trends-and-stats",
    audience: "B",
  },
];

export function referencesFor(audience: "C" | "B"): Reference[] {
  const preferred = REFERENCES.filter((item) => item.audience === audience);
  const rest = REFERENCES.filter((item) => item.audience !== audience);
  return [...preferred, ...rest].slice(0, audience === "C" ? 2 : 1);
}

/** Markdown block appended under the article body. */
export function referencesMarkdown(audience: "C" | "B"): string {
  const lines = referencesFor(audience).map((item) => `- [${item.label}](${item.url})`);
  return `\n\nSources:\n${lines.join("\n")}`;
}
