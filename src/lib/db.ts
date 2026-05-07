import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "testtrainer.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      questions TEXT NOT NULL,
      source_filename TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS test_sessions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      answers TEXT NOT NULL,
      score REAL NOT NULL,
      max_score REAL NOT NULL,
      correct_count INTEGER NOT NULL,
      wrong_count INTEGER NOT NULL,
      skipped_count INTEGER NOT NULL,
      completed_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS scoring_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      correct_pts REAL NOT NULL DEFAULT 1,
      wrong_pts REAL NOT NULL DEFAULT 0,
      unanswered_pts REAL NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO scoring_config (id, correct_pts, wrong_pts, unanswered_pts)
    VALUES (1, 1, 0, 0);
  `);
}
