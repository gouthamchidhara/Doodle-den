// T-047: gallery grid data — newest first, frames + trash hidden, flipbook as one item, favorites filter.
import { setDbForTesting } from '@/db/database';
import { saveArtwork, toggleFavorite, trashArtwork } from '@/db/repositories/artworkRepo';
import { saveFlipbook } from '@/db/repositories/flipbookRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { loadGalleryItems } from '@/games/gallery/galleryItems';
import type { ActivityKey, Artwork } from '@/types/models';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

const art = (id: string, kidId: string, activity: ActivityKey, createdAt: number): Artwork => ({
  id,
  kidId,
  activity,
  title: null,
  pngPath: `art/${kidId}/${id}.png`,
  thumbPath: `art/${kidId}/${id}.thumb.png`,
  strokesPath: null,
  durationSec: 1,
  createdAt,
  updatedAt: createdAt,
  isFavorite: false,
  isSticker: false,
  trashedAt: null,
});

describe('gallery items', () => {
  it('shows newest first with flipbooks as one item', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Ga', avatarId: 'fox', ageMode: 'big' });
    await saveArtwork(art('a1', kid.id, 'draw', 1));
    await saveArtwork(art('a2', kid.id, 'magic', 5));
    await saveArtwork(art('trash', kid.id, 'draw', 6));
    await trashArtwork('trash');
    for (const f of ['f1', 'f2', 'f3']) await saveArtwork(art(f, kid.id, 'flipbook_frame', 2));
    await saveFlipbook({ id: 'b1', kidId: kid.id, frameIds: ['f1', 'f2', 'f3'], fps: 4, createdAt: 3, updatedAt: 3 });
    const items = await loadGalleryItems(kid.id, 'all');
    expect(items.map((i) => i.artwork.id)).toEqual(['a2', 'f1', 'a1']);
    expect(items[0].badges.sparkle).toBe(true);
    expect(items[1].flipbookId).toBe('b1');
    expect(items[1].badges.play).toBe(true);
    await toggleFavorite('a1');
    expect((await loadGalleryItems(kid.id, 'favorites')).map((i) => i.artwork.id)).toEqual(['a1']);
  });
});
