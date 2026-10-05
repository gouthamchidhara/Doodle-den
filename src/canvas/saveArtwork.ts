// Artwork saving (A5 Saving, A3 File paths): PNG 2048 + thumb 400 + strokes JSON, files first, then the DB row.
import { getArtwork, saveArtwork as upsertArtwork } from '@/db/repositories/artworkRepo';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { artPaths, deleteFiles, writeBase64, writeText } from '@/services/files';
import type { ActivityKey, StrokeDoc } from '@/types/models';
import { newId } from '@/utils/ids';

export const EXPORT_LONG_EDGE = 2048;
export const THUMB_LONG_EDGE = 400;

export interface SaveInput {
  kidId: string;
  activity: ActivityKey;
  artworkId?: string | null;
  doc: StrokeDoc | null;
  exportPng: (longEdge: number) => Promise<string>;
  durationSec: number;
  title?: string | null;
  extraFiles?: (artworkId: string) => Promise<string[]>;
}

// Saves (or overwrites) an artwork; returns its id. Throws when nothing could be saved.
export async function saveArtworkFiles(input: SaveInput): Promise<string> {
  const id = input.artworkId ?? newId();
  const paths = artPaths(input.kidId, id);
  const existing = input.artworkId ? await getArtwork(id) : null;
  const png = await input.exportPng(EXPORT_LONG_EDGE);
  const thumb = await input.exportPng(THUMB_LONG_EDGE);
  if (!png || !thumb) throw new Error('export failed');

  const hasStrokes = !!input.doc && input.doc.strokes.length > 0;
  writeBase64(paths.png, png);
  writeBase64(paths.thumb, thumb);
  if (hasStrokes) writeText(paths.strokes, JSON.stringify(input.doc));
  let extra: string[] = [];
  try {
    extra = input.extraFiles ? await input.extraFiles(id) : [];
  } catch (e) {
    if (!existing) deleteFiles([paths.png, paths.thumb, paths.strokes]);
    throw e;
  }

  const now = Date.now();
  try {
    await upsertArtwork({
      id,
      kidId: input.kidId,
      activity: input.activity,
      title: input.title ?? existing?.title ?? null,
      pngPath: paths.png,
      thumbPath: paths.thumb,
      strokesPath: hasStrokes ? paths.strokes : (existing?.strokesPath ?? null),
      durationSec: Math.max(existing?.durationSec ?? 0, Math.round(input.durationSec)),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      isFavorite: existing?.isFavorite ?? false,
      isSticker: existing?.isSticker ?? false,
      trashedAt: existing?.trashedAt ?? null,
    });
  } catch (e) {
    if (!existing) deleteFiles([paths.png, paths.thumb, paths.strokes, ...extra]);
    throw e;
  }
  if (!existing && input.activity !== 'flipbook_frame') await checkRewards(input.kidId, 'ARTWORK_SAVED');
  return id;
}

// Parses a saved strokes JSON file; null when invalid.
export function parseStrokeDoc(json: string | null): StrokeDoc | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json) as Partial<StrokeDoc>;
    if (d.version !== 1 || !Array.isArray(d.strokes) || typeof d.aspect !== 'number') return null;
    return d as StrokeDoc;
  } catch {
    return null;
  }
}
