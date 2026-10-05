// Music Paint note-event files linked to artworks (A3 music_paint).
import type { MusicPaint } from '@/types/feature';

import { getDb } from '../database';

interface Row {
  artwork_id: string;
  notes_path: string;
}

// Gets the notes file for an artwork.
export async function getMusic(artworkId: string): Promise<MusicPaint | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM music_paint WHERE artwork_id = ?', [artworkId]);
  return r ? { artworkId: r.artwork_id, notesPath: r.notes_path } : null;
}

// Lists every artwork id that has music.
export async function listMusicArtworkIds(): Promise<string[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT artwork_id FROM music_paint')).map((r) => r.artwork_id);
}

// Inserts or updates the notes file for an artwork.
export async function saveMusic(m: MusicPaint): Promise<void> {
  const db = await getDb();
  await db.run('INSERT INTO music_paint (artwork_id, notes_path) VALUES (?, ?) ON CONFLICT(artwork_id) DO UPDATE SET notes_path = excluded.notes_path', [
    m.artworkId,
    m.notesPath,
  ]);
}

// Deletes the music row for an artwork.
export async function deleteMusic(artworkId: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM music_paint WHERE artwork_id = ?', [artworkId]);
}
