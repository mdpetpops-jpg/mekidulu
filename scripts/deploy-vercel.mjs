#!/usr/bin/env node
/**
 * Deploy the workspace to Vercel with the REST API (no CLI, no git required).
 *
 *   VERCEL_TOKEN=... node scripts/deploy-vercel.mjs
 *
 * Steps: hash + upload every source file to /v2/files, create a production
 * deployment on the existing project, then poll until it is READY and print
 * the deployment URL. Secrets (.env*) are never uploaded.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? "prj_1XsVFktF8cv25zrDH7Ca6g3csiKc";
const TEAM_ID = process.env.VERCEL_TEAM_ID ?? "team_k3SEntloHTwnjG4dWcjb2WLn";
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME ?? "mekidulu";

if (!TOKEN) {
  console.error("VERCEL_TOKEN is required.");
  process.exit(1);
}

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", ".vercel", "_shots", ".tmp",
  "_legacy", "_pylibs", "_amz", "_cli", ".pnpm-store",
]);
const SKIP_FILE = (name) =>
  name.endsWith(".tar.gz") ||
  name === "tsconfig.tsbuildinfo" ||
  name.startsWith(".env");

function walk(dir = ROOT, prefix = "") {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) out.push(...walk(abs, rel));
    else if (stat.isFile() && !SKIP_FILE(name)) out.push({ rel, abs, size: stat.size });
  }
  return out;
}

const api = async (endpoint, init = {}) => {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await fetch(`https://api.vercel.com${endpoint}`, {
        ...init,
        signal: AbortSignal.timeout(30_000),
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          ...(init.headers ?? {}),
        },
      });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
};

async function upload(file) {
  const buffer = fs.readFileSync(file.abs);
  const sha = crypto.createHash("sha1").update(buffer).digest("hex");
  const response = await api(`/v2/files?teamId=${TEAM_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(buffer.length),
      "x-vercel-digest": sha,
    },
    body: buffer,
  });
  // 409 = file already present with same digest, which is fine.
  if (!response.ok && response.status !== 409) {
    throw new Error(`upload ${file.rel} → ${response.status}: ${await response.text()}`);
  }
  return { file: file.rel, sha, size: buffer.length };
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

async function buildLogs(deploymentId, teamId) {
  const response = await api(`/v3/deployments/${deploymentId}/events?teamId=${teamId}&builds=1&limit=200`);
  if (!response.ok) return "";
  const text = await response.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        const event = JSON.parse(line);
        return event.text ?? "";
      } catch {
        return "";
      }
    })
    .join("")
    .slice(-4000);
}

async function main() {
  const files = walk();
  console.log(`Uploading ${files.length} files…`);

  const uploaded = await pool(files, 4, async (file) => {
    const result = await upload(file);
    process.stdout.write(".");
    return result;
  });
  console.log(`\nUploaded ${uploaded.length} files.`);

  const response = await api(`/v13/deployments?teamId=${TEAM_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: PROJECT_NAME,
      project: PROJECT_ID,
      target: "production",
      files: uploaded,
      projectSettings: {
        framework: "nextjs",
        nodeVersion: "24.x",
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`create deployment → ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }

  console.log(`Deployment ${body.id} queued: https://${body.url}`);
  const started = Date.now();
  let state = body.readyState ?? "QUEUED";
  let last = "";

  while (!["READY", "ERROR", "CANCELED"].includes(state)) {
    if (Date.now() - started > 12 * 60 * 1000) throw new Error("Timed out waiting for the build.");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const poll = await api(`/v13/deployments/${body.id}?teamId=${TEAM_ID}`);
    const info = await poll.json();
    state = info.readyState ?? state;
    if (state !== last) {
      console.log(`  state: ${state}`);
      last = state;
    }
  }

  if (state !== "READY") {
    const logs = await buildLogs(body.id, TEAM_ID);
    console.error(`\nBuild failed.\n${logs}`);
    process.exit(1);
  }

  console.log(`\nREADY → https://${body.url}`);
  console.log(`Project: https://vercel.com/${TEAM_ID}/${PROJECT_NAME}`);
}

main().catch((error) => {
  console.error(`\nDEPLOY FAILED: ${error.message}`);
  process.exit(1);
});
