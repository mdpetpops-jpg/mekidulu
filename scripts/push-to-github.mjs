#!/usr/bin/env node
/**
 * Push this workspace to the Mekidulu GitHub repository using the REST API.
 *
 * No git binary required. Creates blobs → tree → commit → updates the branch
 * ref. The commit is additive: the legacy static files on GitHub Pages stay
 * untouched, so the old site keeps working while Vercel builds the Next app.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/push-to-github.mjs --dry-run
 *   GITHUB_TOKEN=ghp_xxx node scripts/push-to-github.mjs
 *
 * Token requirements: fine-grained PAT for mdpetpops-jpg/mekidulu with
 * "Contents: Read and write". Nothing else.
 */

import fs from "node:fs";
import path from "node:path";

const OWNER = process.env.GH_OWNER ?? "mdpetpops-jpg";
const REPO = process.env.GH_REPO ?? "mekidulu";
const BRANCH = process.env.GH_BRANCH ?? "main";
const TOKEN = process.env.GITHUB_TOKEN;
const DRY_RUN = process.argv.includes("--dry-run");
const COMMIT_MESSAGE =
  process.env.GH_COMMIT_MESSAGE ??
  "feat: Next.js App Router storefront (home, shop, wholesale, leads API)";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "_shots",
  ".tmp",
  ".pnpm-store",
  "_legacy",
  "_pylibs",
  "_amz",
]);
const SKIP_FILES = new Set([
  "mekidulu-nextjs-site.tar.gz",
  "tsconfig.tsbuildinfo",
  ".env.local",
  ".env",
]);

const API = "https://api.github.com";

function collectFiles(dir = ROOT, prefix = "") {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      entries.push(...collectFiles(abs, rel));
    } else if (stat.isFile() && !SKIP_FILES.has(name)) {
      entries.push({ rel, abs, size: stat.size });
    }
  }
  return entries;
}

async function gh(method, endpoint, body) {
  if (!TOKEN) throw new Error("GITHUB_TOKEN is not set.");
  const response = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "mekidulu-deploy-script",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const hint =
      response.status === 401
        ? "Token rejected (check it is not expired)."
        : response.status === 403
          ? "Token lacks Contents: Read and write on this repository."
          : response.status === 404
            ? "Repository not found or token has no access to it."
            : data.message;
    throw new Error(`${method} ${endpoint} → ${response.status}: ${hint}`);
  }
  return data;
}

async function pool(items, limit, worker) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      results.push(await worker(current));
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const files = collectFiles();
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  console.log(`Repository : ${OWNER}/${REPO} (${BRANCH})`);
  console.log(`Files      : ${files.length}`);
  console.log(`Total size : ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `Largest    : ${files
      .slice()
      .sort((a, b) => b.size - a.size)
      .slice(0, 3)
      .map((file) => `${file.rel} (${(file.size / 1024).toFixed(0)} KB)`)
      .join(", ")}`,
  );

  if (DRY_RUN) {
    console.log("\n--dry-run: no writes performed. First 12 paths:");
    for (const file of files.slice(0, 12)) console.log(`  ${file.rel}`);
    if (!TOKEN) console.log("\n(GITHUB_TOKEN not set — real run will stop immediately.)");
    return;
  }

  const ref = await gh("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const headSha = ref.object.sha;
  const headCommit = await gh("GET", `/repos/${OWNER}/${REPO}/git/commits/${headSha}`);
  console.log(`\nHead       : ${headSha.slice(0, 8)} (${headCommit.tree.sha.slice(0, 8)})`);

  console.log("Uploading blobs…");
  const blobs = await pool(files, 6, async (file) => {
    const content = fs.readFileSync(file.abs).toString("base64");
    const blob = await gh("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content,
      encoding: "base64",
    });
    process.stdout.write(".");
    return { path: file.rel, mode: "100644", type: "blob", sha: blob.sha };
  });
  console.log(`\nBlobs      : ${blobs.length}`);

  const tree = await gh("POST", `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: headCommit.tree.sha,
    tree: blobs,
  });

  const commit = await gh("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
    message: COMMIT_MESSAGE,
    tree: tree.sha,
    parents: [headSha],
  });

  await gh("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: false,
  });

  console.log(`\nPushed     : ${commit.sha}`);
  console.log(`Commit URL : https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
  console.log("Vercel will pick this up from the main branch automatically.");
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`);
  process.exitCode = 1;
});
