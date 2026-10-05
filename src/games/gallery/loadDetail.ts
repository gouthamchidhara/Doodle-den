// Everything the gallery detail needs about one artwork: record, strokes, flipbook frames, page/symmetry metadata.
import type { Symmetry } from '@/canvas/symmetry';
import { parseStrokeDoc } from '@/canvas/saveArtwork';
import { getArtwork, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { getFlipbookByFirstFrame } from '@/db/repositories/flipbookRepo';
import { getMeta } from '@/db/repositories/metaRepo';
import { readText } from '@/services/files';
import type { Flipbook } from '@/types/feature';
import type { StrokeDoc } from '@/types/models';

export interface ArtDetail {
  art: ArtworkRecord;
  doc: StrokeDoc | null;
  symmetry: Symmetry;
  coloringPageId: string | null;
  flipbook: Flipbook | null;
  frames: StrokeDoc[];
}

const SYMS: Symmetry[] = [1, 2, 4, 8];

// Loads the detail; null when the artwork is gone.
export async function loadArtDetail(id: string): Promise<ArtDetail | null> {
  const art = await getArtwork(id);
  if (!art) return null;
  const doc = parseStrokeDoc(art.strokesPath ? await readText(art.strokesPath) : null);
  const sym = Number(await getMeta(`kaleido_sym_${id}`));
  const flipbook = art.activity === 'flipbook_frame' ? await getFlipbookByFirstFrame(id) : null;
  const frames: StrokeDoc[] = [];
  for (const fid of flipbook?.frameIds ?? []) {
    const f = await getArtwork(fid);
    const d = parseStrokeDoc(f?.strokesPath ? await readText(f.strokesPath) : null);
    if (d) frames.push(d);
  }
  return {
    art,
    doc,
    symmetry: SYMS.find((s) => s === sym) ?? 1,
    coloringPageId: art.activity === 'coloring' ? await getMeta(`coloring_page_${id}`) : null,
    flipbook,
    frames,
  };
}
