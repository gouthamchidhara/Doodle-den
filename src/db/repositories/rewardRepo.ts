// Earned stickers/rewards per kid (A3).
import type { RewardEarned } from '@/types/models';

import { getDb } from '../database';

interface RewardRow {
  kid_id: string;
  reward_id: string;
  earned_at: number;
}

// Lists earned rewards, oldest first.
export async function listRewards(kidId: string): Promise<RewardEarned[]> {
  const db = await getDb();
  const rows = await db.all<RewardRow>('SELECT * FROM reward_earned WHERE kid_id = ? ORDER BY earned_at ASC', [kidId]);
  return rows.map((r) => ({ kidId: r.kid_id, rewardId: r.reward_id, earnedAt: r.earned_at }));
}

// Grants a reward once; returns true only when it is new.
export async function grantReward(kidId: string, rewardId: string): Promise<boolean> {
  const db = await getDb();
  const r = await db.run('INSERT OR IGNORE INTO reward_earned (kid_id, reward_id, earned_at) VALUES (?, ?, ?)', [kidId, rewardId, Date.now()]);
  return r.changes > 0;
}
