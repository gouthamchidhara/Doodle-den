// Jigsaw best times per (kid, artwork, piece count) (A3 jigsaw_result).
import type { JigsawResult } from '@/types/feature';

import { getDb } from '../database';

interface Row {
  kid_id: string;
  artwork_id: string;
  pieces: number;
  best_time_sec: number;
  completed_at: number;
}

const toResult = (r: Row): JigsawResult => ({
  kidId: r.kid_id,
  artworkId: r.artwork_id,
  pieces: r.pieces,
  bestTimeSec: r.best_time_sec,
  completedAt: r.completed_at,
});

// Lists a kid's jigsaw results, newest first.
export async function listResults(kidId: string): Promise<JigsawResult[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM jigsaw_result WHERE kid_id = ? ORDER BY completed_at DESC', [kidId])).map(toResult);
}

// Gets one result.
export async function getResult(kidId: string, artworkId: string, pieces: number): Promise<JigsawResult | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM jigsaw_result WHERE kid_id = ? AND artwork_id = ? AND pieces = ?', [kidId, artworkId, pieces]);
  return r ? toResult(r) : null;
}

// Saves a finish; keeps the best (lowest) time. Returns true when it is a new best.
export async function saveResult(r: JigsawResult): Promise<boolean> {
  const db = await getDb();
  const prev = await getResult(r.kidId, r.artworkId, r.pieces);
  if (prev && prev.bestTimeSec <= r.bestTimeSec) {
    await db.run('UPDATE jigsaw_result SET completed_at = ? WHERE kid_id = ? AND artwork_id = ? AND pieces = ?', [r.completedAt, r.kidId, r.artworkId, r.pieces]);
    return false;
  }
  await db.run(
    `INSERT INTO jigsaw_result (kid_id, artwork_id, pieces, best_time_sec, completed_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(kid_id, artwork_id, pieces) DO UPDATE SET best_time_sec = excluded.best_time_sec, completed_at = excluded.completed_at`,
    [r.kidId, r.artworkId, r.pieces, Math.round(r.bestTimeSec), r.completedAt],
  );
  return true;
}

// Deletes one result.
export async function deleteResult(kidId: string, artworkId: string, pieces: number): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM jigsaw_result WHERE kid_id = ? AND artwork_id = ? AND pieces = ?', [kidId, artworkId, pieces]);
}
