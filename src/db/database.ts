// Opens the app database (doodleden.db), applies pragmas + migrations once, exposes getDb().
import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';
import type { Db, SqlValue } from './types';

const DB_NAME = 'doodleden.db';

let current: Promise<Db> | null = null;

// Wraps an expo-sqlite connection in the Db interface.
export function wrapExpoDb(raw: SQLite.SQLiteDatabase): Db {
  return {
    exec: (sql) => raw.execAsync(sql),
    run: async (sql, params: SqlValue[] = []) => {
      const r = await raw.runAsync(sql, params);
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowId };
    },
    get: async <T,>(sql: string, params: SqlValue[] = []) => (await raw.getFirstAsync<T>(sql, params)) ?? null,
    all: <T,>(sql: string, params: SqlValue[] = []) => raw.getAllAsync<T>(sql, params),
    transaction: (task) => raw.withTransactionAsync(task),
  };
}

// Opens the database and runs migrations; safe to call many times.
export function getDb(): Promise<Db> {
  if (!current) {
    current = (async () => {
      const raw = await SQLite.openDatabaseAsync(DB_NAME);
      await raw.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      const db = wrapExpoDb(raw);
      await runMigrations(db);
      return db;
    })().catch((error: unknown) => {
      current = null;
      throw error;
    });
  }
  return current;
}

// Test hook: replace the database with an already-migrated instance (or reset with null).
export function setDbForTesting(db: Db | null): void {
  current = db ? Promise.resolve(db) : null;
}
