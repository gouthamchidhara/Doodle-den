// Flipbook animations: ordered frame artwork ids + fps (A3 flipbook).
import type { Flipbook } from '@/types/feature';

import { getDb } from '../database';
import { parseStringArray } from '../json';

interface Row {
  id: string;
  kid_id: string;
  frames_json: string;
  fps: number;
  created_at: number;
  updated_at: number;
}

const toFps = (n: number): Flipbook['fps'] => (n === 2 || n === 8 ? n : 4);
const toBook = (r: Row): Flipbook => ({
  id: r.id,
  kidId: r.kid_id,
  frameIds: parseStringArray(r.frames_json),
  fps: toFps(r.fps),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Lists a kid's flipbooks, newest first.
export async function listFlipbooks(kidId: string): Promise<Flipbook[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM flipbook WHERE kid_id = ? ORDER BY updated_at DESC', [kidId])).map(toBook);
}

// Gets one flipbook.
export async function getFlipbook(id: string): Promise<Flipbook | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM flipbook WHERE id = ?', [id]);
  return r ? toBook(r) : null;
}

// Finds the flipbook whose first frame is this artwork (gallery item).
export async function getFlipbookByFirstFrame(artworkId: string): Promise<Flipbook | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM flipbook WHERE json_extract(frames_json, \'$[0]\') = ?', [artworkId]);
  return r ? toBook(r) : null;
}

// Inserts or updates a flipbook.
export async function saveFlipbook(b: Flipbook): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO flipbook (id, kid_id, frames_json, fps, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET frames_json = excluded.frames_json, fps = excluded.fps, updated_at = excluded.updated_at`,
    [b.id, b.kidId, JSON.stringify(b.frameIds), b.fps, b.createdAt, b.updatedAt],
  );
}

// Deletes a flipbook row.
export async function deleteFlipbook(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM flipbook WHERE id = ?', [id]);
}
