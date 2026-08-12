import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const DATA_DIR = process.env.DATA_DIR || '/app/data'
fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'devtools.db'))
db.pragma('journal_mode = WAL')

// WAL mode lets the hourly-agent.sh script (sqlite3 CLI, same file via bind
// mount) and this API process read/write concurrently without lock errors.
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_key TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS visits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    last_visited_at TEXT
  );

  CREATE TABLE IF NOT EXISTS bastidores_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export default db
