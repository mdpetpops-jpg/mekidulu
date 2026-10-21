#!/usr/bin/env node
/**
 * Batch email scan — same rules as lib/prospecting/extract.ts, run from the
 * command line so a batch can be reviewed before anything is queued for send.
 *
 *   node scripts/scan-emails.mjs domain1.com domain2.com ...
 *   node scripts/scan-emails.mjs --file domains.txt
 */

import fs from "node:fs";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const SKIP = [
  "example.com", "sentry.io", "wixpress.com", "shopify.com", "domain.com", "email.com",
  "yourdomain", "sentry", "no-reply", "noreply", "donotreply", "wordpress", "cloudflare",
];
const PATHS = ["", "/contact", "/contact-us", "/pages/contact", "/about", "/about-us", "/legal", "/imprint"];

function normalize(input) {
  const raw = input.trim();
  if (!raw) return null;
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  return url.hostname.replace(/^www\./, "");
}

function clean(text, domain) {
  const found = new Set();
  for (const match of text.matchAll(EMAIL_RE)) {
    const email = match[0].toLowerCase().replace(/\.$/, "");
    if (SKIP.some((skip) => email.includes(skip))) continue;
    if (email.length > 90) continue;
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(email)) continue;
    found.add(email);
    if (found.size >= 40) break;
  }
  // Own domain only — a supplier address on the page is not this store's inbox.
  return [...found]
    .filter((email) => {
      const emailDomain = email.split("@")[1] ?? "";
      return emailDomain === domain || emailDomain.endsWith(`.${domain}`);
    })
    .slice(0, 3);
}

async function scan(site) {
  const domain = normalize(site);
  if (!domain) return { domain: site, emails: [], note: "invalid" };

  const emails = new Set();
  let checked = 0;

  for (const path of PATHS) {
    try {
      const response = await fetch(`https://${domain}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MekiduluProspecting/1.0)", Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
      checked += 1;
      if (!response.ok) continue;
      const html = await response.text();
      for (const email of clean(html, domain)) emails.add(email);
      if (emails.size >= 2) break;
    } catch {
      /* keep going */
    }
  }

  return {
    domain,
    emails: [...emails].slice(0, 3),
    checked,
    note: emails.size ? "found" : "none",
  };
}

const args = process.argv.slice(2);
let targets = args;
if (args[0] === "--file") {
  targets = fs.readFileSync(args[1], "utf8").split("\n").map((line) => line.trim()).filter(Boolean);
}

const results = [];
for (const target of targets) {
  const result = await scan(target);
  results.push(result);
  console.log(
    `${result.domain.padEnd(34)} ${result.emails.length ? result.emails.join(", ") : "—"}  (${result.checked} pages)`,
  );
}

const found = results.filter((row) => row.emails.length);
console.log(`\n${found.length}/${results.length} sites yielded an address`);
fs.writeFileSync("_scan.json", JSON.stringify(results, null, 1));
