#!/usr/bin/env node
/**
 * Deletes the local SQLite database so the app reseeds a fresh demo dataset
 * the next time it boots.
 *
 *   npm run db:reset
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data");
const files = ["nexus.db", "nexus.db-wal", "nexus.db-shm"];

let removed = 0;
for (const file of files) {
  const target = path.join(dir, file);
  if (fs.existsSync(target)) {
    fs.rmSync(target);
    removed += 1;
  }
}

console.log(
  removed
    ? `Removed ${removed} database file(s). Restart the dev server to reseed.`
    : "No database files found — nothing to reset.",
);
