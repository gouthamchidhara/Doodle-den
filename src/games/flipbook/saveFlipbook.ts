// Saves every frame as a hidden `flipbook_frame` artwork plus the `flipbook` row (A5 Flipbook Studio).
import { exportPngBase64 } from '@/canvas/exportPng';
import { saveArtworkFiles } from '@/canvas/saveArtwork';
import { saveFlipbook } from '@/db/repositories/flipbookRepo';
import { newId } from '@/utils/ids';

import type { FlipbookDraft, Fps } from './flipbookModel';

export interface SavedFlipbook {
  id: string;
  frameIds: string[];
}

// Writes all frames (overwriting earlier saves) and the flipbook row; returns ids.
export async function saveFlipbookDraft(kidId: string, draft: FlipbookDraft, fps: Fps, flipbookId: string | null, createdAt: number | null): Promise<SavedFlipbook> {
  const frameIds: string[] = [];
  for (let i = 0; i < draft.frames.length; i += 1) {
    const doc = draft.frames[i];
    const id = await saveArtworkFiles({
      kidId,
      activity: 'flipbook_frame',
      artworkId: draft.frameIds[i],
      doc,
      exportPng: async (longEdge) => exportPngBase64(doc, longEdge),
      durationSec: 0,
    });
    frameIds.push(id);
  }
  const id = flipbookId ?? newId();
  const now = Date.now();
  await saveFlipbook({ id, kidId, frameIds, fps, createdAt: createdAt ?? now, updatedAt: now });
  return { id, frameIds };
}
