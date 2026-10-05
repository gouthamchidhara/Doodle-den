// My Gallery data (A5): newest first, flipbooks as one item, frames/trash hidden, badges for play/sparkle/voice.
import { listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { listFlipbooks } from '@/db/repositories/flipbookRepo';
import { listMusicArtworkIds } from '@/db/repositories/musicRepo';
import { listAllEntities } from '@/db/repositories/worldRepo';

export type GalleryFilter = 'all' | 'favorites';

export interface GalleryItem {
  artwork: ArtworkRecord;
  flipbookId: string | null;
  badges: { play: boolean; sparkle: boolean; voice: boolean };
}

// Loads the grid for a kid.
export async function loadGalleryItems(kidId: string, filter: GalleryFilter): Promise<GalleryItem[]> {
  const [arts, frames, books, music, entities] = await Promise.all([
    listArtworks(kidId, { excludeActivities: ['flipbook_frame'], favoritesOnly: filter === 'favorites' }),
    listArtworks(kidId, { activities: ['flipbook_frame'] }),
    listFlipbooks(kidId),
    listMusicArtworkIds(),
    listAllEntities(kidId),
  ]);
  const musicSet = new Set(music);
  const voiced = new Set(entities.filter((e) => e.voiceClipId).map((e) => e.artworkId));
  const frameById = new Map(frames.map((f) => [f.id, f]));
  const items: GalleryItem[] = arts.map((a) => ({
    artwork: a,
    flipbookId: null,
    badges: { play: musicSet.has(a.id), sparkle: a.activity === 'magic', voice: voiced.has(a.id) },
  }));
  for (const b of books) {
    const first = frameById.get(b.frameIds[0] ?? '');
    if (!first || (filter === 'favorites' && !first.isFavorite)) continue;
    items.push({ artwork: { ...first, createdAt: b.createdAt, updatedAt: b.updatedAt }, flipbookId: b.id, badges: { play: true, sparkle: false, voice: false } });
  }
  return items.sort((x, y) => y.artwork.createdAt - x.artwork.createdAt);
}
