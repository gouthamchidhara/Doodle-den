// AI stories made from 1-4 drawings (A3 story). body = JSON string of pages.
import type { Story, StoryPage } from '@/types/feature';

import { getDb } from '../database';
import { parseStringArray } from '../json';

interface Row {
  id: string;
  kid_id: string;
  title: string;
  body: string;
  artwork_ids_json: string;
  created_at: number;
}

// Parses stored pages defensively.
function parsePages(json: string): StoryPage[] {
  try {
    const v: unknown = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v
      .filter((p): p is { artIndex: unknown; text: unknown } => typeof p === 'object' && p !== null)
      .filter((p) => typeof p.artIndex === 'number' && typeof p.text === 'string')
      .map((p) => ({ artIndex: p.artIndex as number, text: p.text as string }));
  } catch {
    return [];
  }
}

const toStory = (r: Row): Story => ({
  id: r.id,
  kidId: r.kid_id,
  title: r.title,
  pages: parsePages(r.body),
  artworkIds: parseStringArray(r.artwork_ids_json),
  createdAt: r.created_at,
});

// Lists a kid's stories, newest first.
export async function listStories(kidId: string): Promise<Story[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM story WHERE kid_id = ? ORDER BY created_at DESC', [kidId])).map(toStory);
}

// Gets one story.
export async function getStory(id: string): Promise<Story | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM story WHERE id = ?', [id]);
  return r ? toStory(r) : null;
}

// Inserts or updates a story.
export async function saveStory(s: Story): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO story (id, kid_id, title, body, artwork_ids_json, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, artwork_ids_json = excluded.artwork_ids_json`,
    [s.id, s.kidId, s.title, JSON.stringify(s.pages), JSON.stringify(s.artworkIds), s.createdAt],
  );
}

// Deletes a story (parent zone only).
export async function deleteStory(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM story WHERE id = ?', [id]);
}
