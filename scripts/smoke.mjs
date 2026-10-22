#!/usr/bin/env node
/**
 * Smoke test for the Mekidulu site (tasks 1 & 2).
 *
 * Usage:
 *   node scripts/smoke.mjs                 # against http://127.0.0.1:3100
 *   BASE_URL=https://mekidulu.com node scripts/smoke.mjs
 *
 * Asserts the rendered pages, the lead-capture contract, and the image
 * optimizer. Exit code 1 when any check fails.
 */

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

async function call(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    ...options,
  });
  const text = await response.text();
  return { response, text };
}

function expectContains(text, needle, label) {
  record(label, text.includes(needle), `missing: ${needle}`);
}

async function run() {
  // ---------------------------------------------------------------- pages
  const home = await call("/");
  record("GET / returns 200", home.response.status === 200, `got ${home.response.status}`);
  expectContains(
    home.text,
    "Mekidulu Heavy-Duty Cat Trees",
    "home: hero headline",
  );
  expectContains(
    home.text,
    "Premium Quality. Low MOQ. Dropshipping Supported.",
    "home: hero subtitle",
  );
  expectContains(home.text, "Ready to Ship!", "home: hero headline tail");
  for (const product of ["MEKI-8782", "MEKI-YN105", "MEKI-Y18"]) {
    expectContains(home.text, product, `home: product ${product}`);
  }
  expectContains(
    home.text,
    "Mekidulu Global Design Lab",
    "home: footer brand",
  );
  expectContains(home.text, '"@type":"Organization"', "home: Organization JSON-LD");

  const wholesale = await call("/wholesale");
  record(
    "GET /wholesale returns 200",
    wholesale.response.status === 200,
    `got ${wholesale.response.status}`,
  );
  for (const needle of [
    "Business email",
    "Company name",
    "Estimated volume",
    "Request wholesale pricing",
  ]) {
    expectContains(wholesale.text, needle, `wholesale: field "${needle}"`);
  }
  for (const band of ["10-50", "50-200", "200+"]) {
    record(
      `wholesale: volume option "${band}"`,
      wholesale.text.includes(`value="${band}"`),
      "option missing",
    );
  }
  record(
    "wholesale: honeypot rendered",
    wholesale.text.includes('name="companyUrl"'),
    "honeypot missing",
  );

  const shop = await call("/shop");
  record(
    "GET /shop returns 200",
    shop.response.status === 200,
    `got ${shop.response.status}`,
  );
  for (const needle of [
    "Buy on Amazon",
    "Wholesale inquiry",
    "Marketplace price",
    "https://www.amazon.co.uk/dp/B0DBHM9WWY",
    "cdiscount.com/search/10/mekidulu.html",
    "walmart.com",
  ]) {
    expectContains(shop.text, needle, `shop: "${needle}"`);
  }
  const buyButtons = (shop.text.match(/Buy on Amazon/g) ?? []).length;
  record(
    "shop: one Buy on Amazon per card",
    buyButtons >= 7,
    `found ${buyButtons} CTAs`,
  );

  const manuals = await call("/manuals");
  record(
    "GET /manuals returns 200",
    manuals.response.status === 200,
    `got ${manuals.response.status}`,
  );
  for (const needle of [
    "Assembly manuals",
    "/manuals/8782.pdf",
    "/manuals/YN105.pdf",
  ]) {
    expectContains(manuals.text, needle, `manuals: "${needle}"`);
  }
  const pdf = await call("/manuals/8782.pdf");
  record(
    "manual PDF is served",
    pdf.response.status === 200 &&
      (pdf.response.headers.get("content-type") ?? "").includes("pdf"),
    `got ${pdf.response.status} ${pdf.response.headers.get("content-type")}`,
  );

  const catalogue = await call("/catalog");
  record(
    "GET /catalog returns 200",
    catalogue.response.status === 200,
    `got ${catalogue.response.status}`,
  );
  expectContains(catalogue.text, "Download PDF", "catalog: download CTA");
  expectContains(
    catalogue.text,
    "/catalog/mekidulu-catalogue-2026.pdf",
    "catalog: pdf link",
  );
  const catalogPdf = await call("/catalog/mekidulu-catalogue-2026.pdf");
  record(
    "catalogue PDF is served",
    catalogPdf.response.status === 200 &&
      (catalogPdf.response.headers.get("content-type") ?? "").includes("pdf"),
    `got ${catalogPdf.response.status}`,
  );

  const chatGet = await call("/api/chat");
  record("GET /api/chat -> 405", chatGet.response.status === 405, `got ${chatGet.response.status}`);
  const chatBad = await call("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [] }),
  });
  record(
    "POST /api/chat empty history -> 422",
    chatBad.response.status === 422,
    `got ${chatBad.response.status}`,
  );
  const chatOk = await call("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "How much weight can the 8782 hold?" }] }),
  });
  const chatBody = JSON.parse(chatOk.text);
  record(
    "POST /api/chat answers or degrades cleanly",
    chatOk.response.status === 200 || chatOk.response.status === 503,
    `got ${chatOk.response.status} ${chatBody.error ?? ""}`,
  );
  if (chatOk.response.status === 200) {
    record("chat reply is non-empty", typeof chatBody.reply === "string" && chatBody.reply.length > 20, "short reply");
  }

  // ------------------------------------------------------------ image opt
  const image = await call(
    "/_next/image?url=%2Fimages%2Fhero-banner-01.webp&w=640&q=75",
  );
  record(
    "image optimizer serves hero",
    image.response.status === 200 &&
      (image.response.headers.get("content-type") ?? "").startsWith("image/"),
    `got ${image.response.status} ${image.response.headers.get("content-type")}`,
  );

  // ------------------------------------------------------------- api/leads
  const getLeads = await call("/api/leads");
  record(
    "GET /api/leads -> 405",
    getLeads.response.status === 405,
    `got ${getLeads.response.status}`,
  );
  record(
    "GET /api/leads advertises POST",
    getLeads.response.headers.get("allow") === "POST",
    `Allow: ${getLeads.response.headers.get("allow")}`,
  );

  const wrongType = await call("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "businessEmail=a@b.com",
  });
  record(
    "POST non-JSON -> 415",
    wrongType.response.status === 415,
    `got ${wrongType.response.status}`,
  );

  const badEmail = await call("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessEmail: "not-an-email" }),
  });
  const badEmailBody = JSON.parse(badEmail.text);
  record(
    "POST invalid email -> 422",
    badEmail.response.status === 422,
    `got ${badEmail.response.status}`,
  );
  record(
    "POST invalid email -> field error",
    typeof badEmailBody.fieldErrors?.businessEmail === "string",
    JSON.stringify(badEmailBody.fieldErrors),
  );

  const missingEmail = await call("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName: "Acme Retail" }),
  });
  record(
    "POST missing email -> 422",
    missingEmail.response.status === 422,
    `got ${missingEmail.response.status}`,
  );

  const badVolume = await call("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessEmail: "buyer@example.com", estimatedVolume: "9" }),
  });
  record(
    "POST unknown volume band -> 422",
    badVolume.response.status === 422,
    `got ${badVolume.response.status}`,
  );

  const honeypot = await call("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessEmail: "bot@example.com",
      companyUrl: "https://spam.example",
    }),
  });
  record(
    "POST honeypot -> silent 201 (nothing stored)",
    honeypot.response.status === 201 && JSON.parse(honeypot.text).ok === true,
    `got ${honeypot.response.status}`,
  );

  const valid = await call("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://www.mekidulu.com/wholesale",
    },
    body: JSON.stringify({
      businessEmail: "smoke-test@mekidulu.com",
      companyName: "Smoke test (safe to delete)",
      estimatedVolume: "50-200",
      notes: "automated smoke test — safe to delete.",
    }),
  });
  const validBody = JSON.parse(valid.text);
  record(
    "POST valid lead -> 2xx (501 here means Supabase env missing)",
    valid.response.status === 201 || valid.response.status === 503,
    `got ${valid.response.status} ${validBody.error ?? ""}`,
  );
  if (valid.response.status === 201) {
    record("POST valid lead returns row id", Boolean(validBody.id), "no id returned");
  }

  // ---------------------------------------------------------------- report
  const pad = Math.max(...results.map((r) => r.name.length));
  for (const { name, ok, detail } of results) {
    const mark = ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${name.padEnd(pad)}${ok ? "" : `  <- ${detail}`}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(
    `\n${results.length - failed}/${results.length} checks passed against ${BASE}`,
  );
  if (failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exitCode = 1;
});
