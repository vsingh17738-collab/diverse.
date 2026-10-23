import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'Bronze',
  status TEXT NOT NULL DEFAULT 'active',
  wallet_balance REAL NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '#8b5cf6'
);

CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  zone TEXT NOT NULL,
  specs TEXT NOT NULL DEFAULT '',
  hourly_rate REAL NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'available',
  total_hours REAL NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  genre TEXT NOT NULL,
  players TEXT NOT NULL DEFAULT '1',
  age_rating TEXT NOT NULL DEFAULT 'E',
  rating REAL NOT NULL DEFAULT 4.5,
  status TEXT NOT NULL DEFAULT 'available',
  copies INTEGER NOT NULL DEFAULT 1,
  accent TEXT NOT NULL DEFAULT '#8b5cf6',
  release_year INTEGER NOT NULL DEFAULT 2024,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  players INTEGER NOT NULL DEFAULT 1,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  starts_at TEXT NOT NULL,
  entry_fee REAL NOT NULL DEFAULT 0,
  prize_pool REAL NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 32,
  registered INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT 'Single elimination',
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'card',
  status TEXT NOT NULL DEFAULT 'paid',
  reference TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
`;

const globalForDb = globalThis as unknown as { __nexusDb?: DatabaseSync };

function createDb(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const database = new DatabaseSync(path.join(dir, "nexus.db"));
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA);
  seedDatabase(database);
  return database;
}

export const db: DatabaseSync = globalForDb.__nexusDb ?? createDb();

if (!globalForDb.__nexusDb) {
  globalForDb.__nexusDb = db;
}

type Param = string | number | null | bigint | Uint8Array;

function normalize(params: unknown[]): Param[] {
  return params.map((p) => {
    if (p === undefined || p === null) return null;
    if (typeof p === "boolean") return p ? 1 : 0;
    return p as Param;
  });
}

/**
 * node:sqlite returns rows with a null prototype, which React refuses to
 * serialize across the server/client boundary. Normalize every row to a plain
 * object here so query helpers can be used anywhere.
 */
export function all<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T[] {
  const rows = db.prepare(sql).all(...normalize(params)) as Record<string, unknown>[];
  return rows.map((row) => ({ ...row })) as T[];
}

export function get<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T | undefined {
  const row = db.prepare(sql).get(...normalize(params)) as
    | Record<string, unknown>
    | undefined;
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: unknown[]) {
  const result = db.prepare(sql).run(...normalize(params));
  return {
    changes: Number(result.changes ?? 0),
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
  };
}
