// Test-only Db backed by Node's built-in sqlite (in-memory), migrated like the app DB.
import { runMigrations } from '@/db/migrations';
import type { Db, SqlValue } from '@/db/types';

interface StatementSync {
  run(...params: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: SqlValue[]): unknown;
  all(...params: SqlValue[]): unknown[];
}
interface DatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
}

// Creates an in-memory database with foreign keys on and all migrations applied.
export async function createTestDb(): Promise<Db> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync: Ctor } = require('node:sqlite') as { DatabaseSync: new (path: string) => DatabaseSync };
  const raw = new Ctor(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  const clean = (rows: unknown) => JSON.parse(JSON.stringify(rows)) as unknown;
  const db: Db = {
    exec: async (sql) => raw.exec(sql),
    run: async (sql, params = []) => {
      const r = raw.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    get: async <T,>(sql: string, params: SqlValue[] = []) => (clean(raw.prepare(sql).get(...params) ?? null) as T | null),
    all: async <T,>(sql: string, params: SqlValue[] = []) => clean(raw.prepare(sql).all(...params)) as T[],
    transaction: async (task) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
  await runMigrations(db);
  return db;
}
