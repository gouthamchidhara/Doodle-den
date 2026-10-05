// Key/value app settings in app_meta (A3).
import { getDb } from '../database';

// Reads one app_meta value, or null when missing.
export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.get<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

// Writes (inserts or replaces) one app_meta value.
export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run('INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

// Deletes one app_meta key.
export async function deleteMeta(key: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM app_meta WHERE key = ?', [key]);
}
