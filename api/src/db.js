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

  -- Achados do organizer-agent.sh (duplicação/desorganização entre páginas)
  -- que o hourly-agent.sh resolve um de cada vez, com a mesma prioridade
  -- que já dá pra bugs reportados.
  CREATE TABLE IF NOT EXISTS housekeeping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routes TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
  );
`)

// `visits` nasceu antes da classificação de bot/IA existir, então as duas
// colunas abaixo entram via ALTER em bancos já existentes (CREATE TABLE IF
// NOT EXISTS não adiciona coluna nova a uma tabela que já existe).
const visitsColumns = db.prepare("PRAGMA table_info(visits)").all().map((c) => c.name)
if (!visitsColumns.includes('bot_count')) {
  db.exec('ALTER TABLE visits ADD COLUMN bot_count INTEGER NOT NULL DEFAULT 0')
}
if (!visitsColumns.includes('ai_bot_count')) {
  db.exec('ALTER TABLE visits ADD COLUMN ai_bot_count INTEGER NOT NULL DEFAULT 0')
}

export default db
