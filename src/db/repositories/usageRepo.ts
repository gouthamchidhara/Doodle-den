// Daily play-time totals per kid (A3).
import type { ActivityKey, UsageDay } from '@/types/models';
import { shiftDayKey } from '@/utils/time';

import { getDb } from '../database';
import { enqueueSync } from '../syncQueue';
import type { Db } from '../types';

interface UsageRow {
  kid_id: string;
  day_key: string;
  used_sec: number;
  sessions: number;
  extensions_used: number;
  per_activity_json: string;
}

// Parses per-activity JSON defensively.
function parseActivities(json: string): Partial<Record<ActivityKey, number>> {
  try {
    const v: unknown = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Partial<Record<ActivityKey, number>>) : {};
  } catch {
    return {};
  }
}

const empty = (kidId: string, dayKey: string): UsageDay => ({ kidId, dayKey, usedSec: 0, sessions: 0, extensionsUsed: 0, perActivitySec: {} });

const toUsage = (r: UsageRow): UsageDay => ({
  kidId: r.kid_id,
  dayKey: r.day_key,
  usedSec: r.used_sec,
  sessions: r.sessions,
  extensionsUsed: r.extensions_used,
  perActivitySec: parseActivities(r.per_activity_json),
});

// Makes sure a usage_day row exists for (kid, day).
async function ensureRow(db: Db, kidId: string, dayKey: string): Promise<void> {
  await db.run('INSERT OR IGNORE INTO usage_day (kid_id, day_key) VALUES (?, ?)', [kidId, dayKey]);
}

// Gets one day's usage (zeros when missing).
export async function getUsageDay(kidId: string, dayKey: string): Promise<UsageDay> {
  const db = await getDb();
  const row = await db.get<UsageRow>('SELECT * FROM usage_day WHERE kid_id = ? AND day_key = ?', [kidId, dayKey]);
  return row ? toUsage(row) : empty(kidId, dayKey);
}

// Adds played seconds to a day, optionally attributed to one activity.
export async function addUsage(kidId: string, dayKey: string, sec: number, activity?: ActivityKey | null): Promise<void> {
  if (sec <= 0) return;
  const db = await getDb();
  await db.transaction(async () => {
    await ensureRow(db, kidId, dayKey);
    const row = await db.get<UsageRow>('SELECT * FROM usage_day WHERE kid_id = ? AND day_key = ?', [kidId, dayKey]);
    const per = parseActivities(row?.per_activity_json ?? '{}');
    if (activity) per[activity] = (per[activity] ?? 0) + sec;
    await db.run('UPDATE usage_day SET used_sec = used_sec + ?, per_activity_json = ? WHERE kid_id = ? AND day_key = ?', [
      Math.round(sec),
      JSON.stringify(per),
      kidId,
      dayKey,
    ]);
    await enqueueSync(db, 'usage_day', `${kidId}|${dayKey}`, 'upsert');
  });
}

// Counts one more session for the day.
export async function incrementSessions(kidId: string, dayKey: string): Promise<void> {
  const db = await getDb();
  await ensureRow(db, kidId, dayKey);
  await db.run('UPDATE usage_day SET sessions = sessions + 1 WHERE kid_id = ? AND day_key = ?', [kidId, dayKey]);
  await enqueueSync(db, 'usage_day', `${kidId}|${dayKey}`, 'upsert');
}

// Counts one more "finish my drawing" extension for the day.
export async function incrementExtensions(kidId: string, dayKey: string): Promise<void> {
  const db = await getDb();
  await ensureRow(db, kidId, dayKey);
  await db.run('UPDATE usage_day SET extensions_used = extensions_used + 1 WHERE kid_id = ? AND day_key = ?', [kidId, dayKey]);
  await enqueueSync(db, 'usage_day', `${kidId}|${dayKey}`, 'upsert');
}

// Returns 7 days ending at endDayKey (oldest first), zero-filled.
export async function getWeek(kidId: string, endDayKey: string): Promise<UsageDay[]> {
  const db = await getDb();
  const startKey = shiftDayKey(endDayKey, -6);
  const rows = await db.all<UsageRow>('SELECT * FROM usage_day WHERE kid_id = ? AND day_key BETWEEN ? AND ?', [kidId, startKey, endDayKey]);
  const byKey = new Map(rows.map((r) => [r.day_key, toUsage(r)]));
  return Array.from({ length: 7 }, (_, i) => {
    const key = shiftDayKey(startKey, i);
    return byKey.get(key) ?? empty(kidId, key);
  });
}
