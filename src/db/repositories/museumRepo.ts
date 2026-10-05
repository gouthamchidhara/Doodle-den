// Museum Night exhibits (A3 museum_exhibit).
import type { MuseumExhibit } from '@/types/feature';

import { getDb } from '../database';
import { parseStringArray } from '../json';

interface Row {
  id: string;
  kid_id: string;
  artwork_ids_json: string;
  created_at: number;
}

const toExhibit = (r: Row): MuseumExhibit => ({ id: r.id, kidId: r.kid_id, artworkIds: parseStringArray(r.artwork_ids_json), createdAt: r.created_at });

// Lists a kid's exhibits, newest first.
export async function listExhibits(kidId: string): Promise<MuseumExhibit[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM museum_exhibit WHERE kid_id = ? ORDER BY created_at DESC', [kidId])).map(toExhibit);
}

// Gets one exhibit.
export async function getExhibit(id: string): Promise<MuseumExhibit | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM museum_exhibit WHERE id = ?', [id]);
  return r ? toExhibit(r) : null;
}

// Inserts or updates an exhibit.
export async function saveExhibit(e: MuseumExhibit): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO museum_exhibit (id, kid_id, artwork_ids_json, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET artwork_ids_json = excluded.artwork_ids_json',
    [e.id, e.kidId, JSON.stringify(e.artworkIds), e.createdAt],
  );
}

// Deletes an exhibit.
export async function deleteExhibit(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM museum_exhibit WHERE id = ?', [id]);
}
