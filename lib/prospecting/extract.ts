/**
 * Domain → email extraction.
 *
 * Google scraping is unreliable (and against their terms), so prospecting works
 * the way outbound teams actually do it: take a domain you already know is a
 * cat-furniture retailer and read its own site for a contact address.
 *
 * Sources checked, in order: the page given, /contact, /contact-us, /about,
 * /pages/contact (Shopify), /legal. `mailto:` links and plain text addresses
 * are both considered.
 */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const SKIP_EMAIL = [
  "example.com",
  "sentry.io",
  "wixpress.com",
  "shopify.com",
  "domain.com",
  "email.com",
  "yourdomain",
  "sentry",
  "no-reply",
  "noreply",
  "donotreply",
  "wordpress",
  "cloudflare",
];

const CONTACT_PATHS = ["", "/contact", "/contact-us", "/pages/contact", "/about", "/about-us", "/legal", "/imprint"];

export type Extraction = {
  emails: string[];
  pagesChecked: number;
  error?: string;
};

function normalizeDomain(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function cleanEmails(text: string, domain: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(EMAIL_RE)) {
    const email = match[0].toLowerCase().replace(/\.$/, "");
    if (SKIP_EMAIL.some((skip) => email.includes(skip))) continue;
    if (email.length > 90) continue;
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(email)) continue;
    found.add(email);
    if (found.size >= 40) break;
  }

  // Only keep addresses on the retailer's own domain. Anything else on the page
  // (supplier, platform, agency) belongs to someone else and must not be mailed.
  return [...found]
    .filter((email) => {
      const emailDomain = email.split("@")[1] ?? "";
      return emailDomain === domain || emailDomain.endsWith(`.${domain}`);
    })
    .slice(0, 3);
}

export async function extractEmailsFromSite(site: string): Promise<Extraction> {
  const domain = normalizeDomain(site);
  if (!domain) return { emails: [], pagesChecked: 0, error: "Invalid domain" };

  const emails = new Set<string>();
  let pagesChecked = 0;

  for (const path of CONTACT_PATHS) {
    const url = `https://${domain}${path}`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MekiduluProspecting/1.0)",
          Accept: "text/html",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });
      pagesChecked += 1;
      if (!response.ok) continue;

      const html = await response.text();
      for (const email of cleanEmails(html, domain)) emails.add(email);
      if (emails.size >= 2) break;
    } catch {
      // a single unreachable path should not fail the whole probe
    }
  }

  return {
    emails: [...emails].slice(0, 3),
    pagesChecked,
    error: emails.size === 0 ? "No address found on the site" : undefined,
  };
}
