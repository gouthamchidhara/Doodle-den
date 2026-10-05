// Records of AI Magic results (A3 ai_result).
import type { AiFeature, AiResult } from '@/types/feature';

import { getDb } from '../database';

interface Row {
  id: string;
  kid_id: string;
  feature: AiFeature;
  source_artwork_id: string | null;
  output_artwork_id: string | null;
  created_at: number;
}

const toResult = (r: Row): AiResult => ({
  id: r.id,
  kidId: r.kid_id,
  feature: r.feature,
  sourceArtworkId: r.source_artwork_id,
  outputArtworkId: r.output_artwork_id,
  createdAt: r.created_at,
});

// Lists a kid's AI results, optionally for one feature, newest first.
export async function listAiResults(kidId: string, feature?: AiFeature): Promise<AiResult[]> {
  const db = await getDb();
  const rows = feature
    ? await db.all<Row>('SELECT * FROM ai_result WHERE kid_id = ? AND feature = ? ORDER BY created_at DESC', [kidId, feature])
    : await db.all<Row>('SELECT * FROM ai_result WHERE kid_id = ? ORDER BY created_at DESC', [kidId]);
  return rows.map(toResult);
}

// Gets one AI result.
export async function getAiResult(id: string): Promise<AiResult | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM ai_result WHERE id = ?', [id]);
  return r ? toResult(r) : null;
}

// Finds the AI result whose output is this artwork (sparkle badge).
export async function getByOutputArtwork(artworkId: string): Promise<AiResult | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM ai_result WHERE output_artwork_id = ?', [artworkId]);
  return r ? toResult(r) : null;
}

// Inserts or updates an AI result.
export async function saveAiResult(a: AiResult): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO ai_result (id, kid_id, feature, source_artwork_id, output_artwork_id, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET output_artwork_id = excluded.output_artwork_id`,
    [a.id, a.kidId, a.feature, a.sourceArtworkId, a.outputArtworkId, a.createdAt],
  );
}

// Deletes an AI result row.
export async function deleteAiResult(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM ai_result WHERE id = ?', [id]);
}
