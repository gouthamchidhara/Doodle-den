// Artwork index rows; files live under art/<kidId>/ (A3).
import type { ActivityKey, Artwork } from '@/types/models';

import { getDb } from '../database';
import { enqueueSync } from '../syncQueue';

export interface ArtworkRecord extends Artwork {
  familyShared: boolean;
  stickerPath: string | null;
}

interface ArtworkRow {
  id: string;
  kid_id: string;
  activity: ActivityKey;
  title: string | null;
  png_path: string;
  thumb_path: string;
  strokes_path: string | null;
  duration_sec: number;
  created_at: number;
  updated_at: number;
  is_favorite: number;
  is_sticker: number;
  trashed_at: number | null;
  family_shared: number;
  sticker_path: string | null;
}

const toArtwork = (r: ArtworkRow): ArtworkRecord => ({
  id: r.id,
  kidId: r.kid_id,
  activity: r.activity,
  title: r.title,
  pngPath: r.png_path,
  thumbPath: r.thumb_path,
  strokesPath: r.strokes_path,
  durationSec: r.duration_sec,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  isFavorite: r.is_favorite === 1,
  isSticker: r.is_sticker === 1,
  trashedAt: r.trashed_at,
  familyShared: r.family_shared === 1,
  stickerPath: r.sticker_path,
});

export interface ListArtworkOptions {
  favoritesOnly?: boolean;
  includeTrashed?: boolean;
  onlyTrashed?: boolean;
  excludeActivities?: ActivityKey[];
  activities?: ActivityKey[];
}

// Lists a kid's artworks, newest first.
export async function listArtworks(kidId: string, opts: ListArtworkOptions = {}): Promise<ArtworkRecord[]> {
  const db = await getDb();
  const where = ['kid_id = ?'];
  const params: (string | number)[] = [kidId];
  if (opts.onlyTrashed) where.push('trashed_at IS NOT NULL');
  else if (!opts.includeTrashed) where.push('trashed_at IS NULL');
  if (opts.favoritesOnly) where.push('is_favorite = 1');
  if (opts.excludeActivities?.length) {
    where.push(`activity NOT IN (${opts.excludeActivities.map(() => '?').join(', ')})`);
    params.push(...opts.excludeActivities);
  }
  if (opts.activities?.length) {
    where.push(`activity IN (${opts.activities.map(() => '?').join(', ')})`);
    params.push(...opts.activities);
  }
  const rows = await db.all<ArtworkRow>(`SELECT * FROM artwork WHERE ${where.join(' AND ')} ORDER BY created_at DESC`, params);
  return rows.map(toArtwork);
}

// Gets one artwork.
export async function getArtwork(id: string): Promise<ArtworkRecord | null> {
  const db = await getDb();
  const row = await db.get<ArtworkRow>('SELECT * FROM artwork WHERE id = ?', [id]);
  return row ? toArtwork(row) : null;
}

// Inserts or updates an artwork row (files must already be written).
export async function saveArtwork(a: Artwork & Partial<Pick<ArtworkRecord, 'familyShared' | 'stickerPath'>>): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO artwork (id, kid_id, activity, title, png_path, thumb_path, strokes_path, duration_sec, created_at, updated_at,
       is_favorite, is_sticker, trashed_at, family_shared, sticker_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, png_path = excluded.png_path, thumb_path = excluded.thumb_path,
       strokes_path = excluded.strokes_path, duration_sec = excluded.duration_sec, updated_at = excluded.updated_at,
       is_favorite = excluded.is_favorite, is_sticker = excluded.is_sticker, trashed_at = excluded.trashed_at,
       family_shared = excluded.family_shared, sticker_path = excluded.sticker_path`,
    [
      a.id,
      a.kidId,
      a.activity,
      a.title,
      a.pngPath,
      a.thumbPath,
      a.strokesPath,
      Math.round(a.durationSec),
      a.createdAt,
      a.updatedAt,
      a.isFavorite ? 1 : 0,
      a.isSticker ? 1 : 0,
      a.trashedAt,
      a.familyShared ? 1 : 0,
      a.stickerPath ?? null,
    ],
  );
  await enqueueSync(db, 'artwork', a.id, 'upsert');
}

// Updates selected columns of an artwork.
async function patch(id: string, sql: string, params: (string | number | null)[]): Promise<void> {
  const db = await getDb();
  await db.run(`UPDATE artwork SET ${sql}, updated_at = ? WHERE id = ?`, [...params, Date.now(), id]);
  await enqueueSync(db, 'artwork', id, 'upsert');
}

// Flips the favorite flag; returns the new value.
export async function toggleFavorite(id: string): Promise<boolean> {
  const a = await getArtwork(id);
  if (!a) return false;
  await patch(id, 'is_favorite = ?', [a.isFavorite ? 0 : 1]);
  return !a.isFavorite;
}

// Moves an artwork to the trash (kids can do this).
export async function trashArtwork(id: string): Promise<void> {
  await patch(id, 'trashed_at = ?', [Date.now()]);
}

// Takes an artwork back out of the trash.
export async function restoreArtwork(id: string): Promise<void> {
  await patch(id, 'trashed_at = NULL', []);
}

// Marks an artwork as a sticker with its transparent PNG.
export async function setSticker(id: string, stickerPath: string): Promise<void> {
  await patch(id, 'is_sticker = 1, sticker_path = ?', [stickerPath]);
}

// Marks an artwork as shared (or not) to the Family Gallery.
export async function setFamilyShared(id: string, shared: boolean): Promise<void> {
  await patch(id, 'family_shared = ?', [shared ? 1 : 0]);
}

// Parent only: deletes trashed rows and returns them so the caller deletes their files.
export async function emptyTrash(kidId: string): Promise<ArtworkRecord[]> {
  const db = await getDb();
  const trashed = await listArtworks(kidId, { onlyTrashed: true });
  await db.transaction(async () => {
    for (const a of trashed) {
      await db.run('DELETE FROM artwork WHERE id = ?', [a.id]);
      await enqueueSync(db, 'artwork', a.id, 'delete');
    }
  });
  return trashed;
}

// Lists artworks turned into stickers (not trashed), newest first.
export async function listStickers(kidId: string): Promise<ArtworkRecord[]> {
  const db = await getDb();
  const rows = await db.all<ArtworkRow>(
    'SELECT * FROM artwork WHERE kid_id = ? AND is_sticker = 1 AND trashed_at IS NULL ORDER BY created_at DESC',
    [kidId],
  );
  return rows.map(toArtwork);
}

// Counts saved (non-trashed) artworks, excluding flipbook frames.
export async function countArtworks(kidId: string): Promise<number> {
  const db = await getDb();
  const row = await db.get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM artwork WHERE kid_id = ? AND trashed_at IS NULL AND activity != 'flipbook_frame'",
    [kidId],
  );
  return row?.n ?? 0;
}
