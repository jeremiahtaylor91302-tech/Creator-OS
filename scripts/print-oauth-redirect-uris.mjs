#!/usr/bin/env node
/**
 * Prints exact Authorized redirect URIs for Google Cloud Console.
 * Reads .env.local (if present) plus current process.env for APP_URL / NEXT_PUBLIC_APP_URL.
 *
 * Usage (do NOT put a dot before npm — that runs `source npm` in zsh and breaks):
 *   npm run oauth:redirects
 *   node scripts/print-oauth-redirect-uris.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function parseDotEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function normalizeBase(url) {
  if (!url) return null;
  const s = url.trim().replace(/\/+$/, "");
  if (!s.startsWith("http://") && !s.startsWith("https://")) return null;
  return s;
}

const fileEnv = fs.existsSync(envPath) ? parseDotEnv(fs.readFileSync(envPath, "utf8")) : {};
const fromFile = fileEnv.APP_URL || fileEnv.NEXT_PUBLIC_APP_URL;
const fromProcess = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
const appUrl = normalizeBase(fromProcess) || normalizeBase(fromFile);

const PROVIDERS = ["youtube", "tiktok", "instagram", "twitter", "podcast"];

console.log(
  "\nCreator OS — Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs\n→ Authorized redirect URIs (add each line that matches how you host the app):\n",
);

const entries = [];
if (appUrl) entries.push({ label: "From APP_URL / NEXT_PUBLIC_APP_URL (.env.local or shell)", base: appUrl });
entries.push({ label: "Local Next dev (optional)", base: "http://localhost:3000" });

const seen = new Set();
for (const { label, base } of entries) {
  if (!base || seen.has(base)) continue;
  seen.add(base);
  console.log(`--- ${label} ---\n${base}\n`);
  const lines = [
    `${base}/oauth/google-calendar/callback`,
    ...PROVIDERS.map((p) => `${base}/oauth/${p}/callback`),
  ];
  for (const line of lines) console.log(line);
  console.log("");
}

console.log(
  "Also enable APIs for this Google project: Google Calendar API (calendar connect), YouTube Data API v3 (YouTube connect), etc.\n",
);

if (!appUrl) {
  console.log(
    "No production APP_URL found. Set APP_URL=https://your-domain.com in .env.local (and Vercel env), then run this script again.\n",
  );
}
