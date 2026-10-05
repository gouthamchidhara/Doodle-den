// Recorded silly voices for drawings (A3 voice_clip). Never uploaded.
import type { VoiceClip, VoicePreset } from '@/types/feature';

import { getDb } from '../database';

interface Row {
  id: string;
  kid_id: string;
  path: string;
  preset: VoicePreset;
  duration_ms: number;
  created_at: number;
}

const toClip = (r: Row): VoiceClip => ({ id: r.id, kidId: r.kid_id, path: r.path, preset: r.preset, durationMs: r.duration_ms, createdAt: r.created_at });

// Lists a kid's clips, newest first.
export async function listClips(kidId: string): Promise<VoiceClip[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM voice_clip WHERE kid_id = ? ORDER BY created_at DESC', [kidId])).map(toClip);
}

// Gets one clip.
export async function getClip(id: string): Promise<VoiceClip | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM voice_clip WHERE id = ?', [id]);
  return r ? toClip(r) : null;
}

// Inserts or updates a clip.
export async function saveClip(c: VoiceClip): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO voice_clip (id, kid_id, path, preset, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET path = excluded.path, preset = excluded.preset, duration_ms = excluded.duration_ms`,
    [c.id, c.kidId, c.path, c.preset, Math.round(c.durationMs), c.createdAt],
  );
}

// Deletes a clip row (caller deletes the file).
export async function deleteClip(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM voice_clip WHERE id = ?', [id]);
}
