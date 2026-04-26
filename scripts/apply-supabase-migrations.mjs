#!/usr/bin/env node
/**
 * Applies every file in supabase/migrations (sorted by filename) to the database.
 *
 * Usage (production — use the pooled or direct connection string from Supabase
 * Dashboard → Project Settings → Database):
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@..." npm run db:migrate
 *
 * Print combined SQL only (paste into SQL Editor):
 *   npm run db:migrate:print > /tmp/creatoros-migrations.sql
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

const printOnly = process.argv.includes("--print") || process.env.PRINT_MIGRATIONS === "1";

async function main() {
  const names = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (names.length === 0) {
    console.error("No .sql files in supabase/migrations");
    process.exit(1);
  }

  const chunks = [];
  for (const name of names) {
    const body = await readFile(join(migrationsDir, name), "utf8");
    chunks.push(`--\n-- ${name}\n--\n\n${body.trim()}\n`);
  }
  const combined = chunks.join("\n");

  if (printOnly) {
    process.stdout.write(combined + "\n");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "Set DATABASE_URL to your Supabase Postgres connection string, or run with --print and paste into SQL Editor.",
    );
    process.exit(1);
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    for (const name of names) {
      const sql = await readFile(join(migrationsDir, name), "utf8");
      process.stderr.write(`Applying ${name}...\n`);
      await client.query(sql);
    }
    process.stderr.write(`Done (${names.length} migrations).\n`);
  } finally {
    await client.end();
  }
}

// Avoid top-level await for slightly older Node if needed
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
