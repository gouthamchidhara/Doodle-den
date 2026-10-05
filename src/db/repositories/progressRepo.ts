// Skill progress per kid, e.g. 'trace_A' or 'color_purple' (A3).
import type { Progress } from '@/types/models';

import { getDb } from '../database';

interface ProgressRow {
  kid_id: string;
  skill: string;
  level: number;
  updated_at: number;
}

// Lists all skills for a kid.
export async function getProgress(kidId: string): Promise<Progress[]> {
  const db = await getDb();
  const rows = await db.all<ProgressRow>('SELECT * FROM progress WHERE kid_id = ? ORDER BY skill', [kidId]);
  return rows.map((r) => ({ kidId: r.kid_id, skill: r.skill, level: r.level, updatedAt: r.updated_at }));
}

// Sets a skill level (upsert).
export async function setSkill(kidId: string, skill: string, level: number): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO progress (kid_id, skill, level, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(kid_id, skill) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at',
    [kidId, skill, level, Date.now()],
  );
}
