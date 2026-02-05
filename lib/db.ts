import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sports.db');

let dbInstance: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeSchema(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_normalized TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      league TEXT NOT NULL,
      team TEXT,
      position TEXT,
      years_active TEXT,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS players_name_normalized_idx ON players(name_normalized);
    CREATE INDEX IF NOT EXISTS players_league_idx ON players(league);

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total INTEGER NOT NULL,
      nba INTEGER NOT NULL,
      nfl INTEGER NOT NULL,
      mlb INTEGER NOT NULL,
      nhl INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores(created_at DESC);
  `);
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  ensureDirectoryExists(DB_PATH);

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
    initializeSchema(dbInstance);
  }

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  ensureDirectoryExists(DB_PATH);
  const data = dbInstance.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Wrapper for prepared statement-like API
export function prepareStatement(db: SqlJsDatabase, sql: string) {
  return {
    all: (...params: unknown[]) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results: Record<string, unknown>[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    get: (...params: unknown[]) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let result: Record<string, unknown> | undefined;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    run: (...params: unknown[]) => {
      db.run(sql, params);
    }
  };
}
