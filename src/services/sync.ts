// Sync queue processing (A3 Sync rules): consent + session + online; oldest first; stop at the first error.
import { AppState } from 'react-native';

import { getDb } from '@/db/database';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { isOnline } from '@/services/ai';
import { ensureFamily } from '@/services/auth';
import { getSupabase } from '@/services/supabase';

import { pushRow, type QueueRow } from './syncPush';

export const CONSENT_SYNC_KEY = 'consent_sync';
const EVERY_MS = 5 * 60 * 1000;
let running = false;

// True when the parent agreed to cloud backup.
export async function hasSyncConsent(): Promise<boolean> {
  return (await getMeta(CONSENT_SYNC_KEY)) === 'true';
}

// Stores the backup choice; turning it on also queues everything that exists now.
export async function setSyncConsent(on: boolean): Promise<void> {
  await setMeta(CONSENT_SYNC_KEY, on ? 'true' : 'false');
  if (!on) return;
  const db = await getDb();
  const now = Date.now();
  await db.run("INSERT INTO sync_queue (table_name, row_key, op, created_at) SELECT 'kid_profile', id, 'upsert', ? FROM kid_profile", [now]);
  await db.run("INSERT INTO sync_queue (table_name, row_key, op, created_at) SELECT 'time_rule', kid_id, 'upsert', ? FROM time_rule", [now]);
  await db.run("INSERT INTO sync_queue (table_name, row_key, op, created_at) SELECT 'usage_day', kid_id || '|' || day_key, 'upsert', ? FROM usage_day", [now]);
  await db.run(
    "INSERT INTO sync_queue (table_name, row_key, op, created_at) SELECT 'artwork', id, 'upsert', ? FROM artwork WHERE trashed_at IS NULL AND activity != 'flipbook_frame'",
    [now],
  );
}

// Rows still waiting.
export async function pendingCount(): Promise<number> {
  const db = await getDb();
  return (await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_queue'))?.n ?? 0;
}

// One pass over the queue; returns how many rows were pushed (0 when a gate is closed).
export async function runSync(): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const sb = getSupabase();
    if (!sb || !(await hasSyncConsent())) return 0;
    if (!(await sb.auth.getSession()).data.session) return 0;
    if (!(await isOnline())) return 0;
    const family = await ensureFamily();
    if (!family) return 0;
    const db = await getDb();
    const rows = await db.all<QueueRow>('SELECT id, table_name, row_key, op FROM sync_queue ORDER BY id ASC');
    let pushed = 0;
    for (const row of rows) {
      try {
        await pushRow(sb, family, row);
      } catch (e) {
        console.warn('[sync] push failed; retry next run', e);
        break;
      }
      await db.run('DELETE FROM sync_queue WHERE id = ?', [row.id]);
      pushed++;
    }
    return pushed;
  } catch (e) {
    console.warn('[sync] run failed', e);
    return 0;
  } finally {
    running = false;
  }
}

// Runs now and every 5 minutes while the app is in the foreground; returns a stop function.
export function startSyncLoop(): () => void {
  void runSync();
  let timer: ReturnType<typeof setInterval> | null = setInterval(() => void runSync(), EVERY_MS);
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') {
      void runSync();
      if (!timer) timer = setInterval(() => void runSync(), EVERY_MS);
    } else if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
  return () => {
    if (timer) clearInterval(timer);
    sub.remove();
  };
}
