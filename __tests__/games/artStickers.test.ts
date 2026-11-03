// T-059: sticker from a stroke drawing (trimmed export) and from a coloring page (white keying) both work.
import { setDbForTesting } from '@/db/database';
import { getArtwork, listStickers, saveArtwork } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { makeSticker, stickerPath } from '@/games/stickers/artStickers';
import { writeBase64, writeText } from '@/services/files';
import type { ActivityKey, Artwork } from '@/types/models';

import { fsData } from '../helpers/mockFs';
import { createTestDb } from '../helpers/nodeDb';

const mockTrim = jest.fn(() => 'trimmed');
const mockKey = jest.fn(() => ({ ok: true, png: 'keyed', width: 10, height: 10 }));
jest.mock('@/canvas/exportTrimmed', () => ({ exportTrimmedPng: () => mockTrim() }));
jest.mock('@/games/paper/processPhoto', () => ({ keyEncodedImage: () => mockKey() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

const art = (id: string, kidId: string, activity: ActivityKey, strokesPath: string | null): Artwork => ({
  id, kidId, activity, title: null, pngPath: `art/${kidId}/${id}.png`, thumbPath: 't', strokesPath, durationSec: 0, createdAt: 1, updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null,
});

describe('art stickers', () => {
  it('makes stickers from strokes and from a coloring page', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'St', avatarId: 'fox', ageMode: 'big' });
    writeText(`art/${kid.id}/s.strokes.json`, JSON.stringify({ version: 1, aspect: 1, background: 'white', strokes: [{ id: 'x', tool: 'crayon', color: 'sky', size: 'M', points: [{ x: 0.5, y: 0.5, p: 0.5, t: 0 }] }] }));
    await saveArtwork(art('s', kid.id, 'draw', `art/${kid.id}/s.strokes.json`));
    writeBase64(`art/${kid.id}/c.png`, 'png');
    await saveArtwork(art('c', kid.id, 'coloring', null));
    expect(await makeSticker((await getArtwork('s'))!)).toBe(true);
    expect(await makeSticker((await getArtwork('c'))!)).toBe(true);
    expect(fsData.get(`file:///doc/${stickerPath(kid.id, 's')}`)).toBe('trimmed');
    expect(fsData.get(`file:///doc/${stickerPath(kid.id, 'c')}`)).toBe('keyed');
    expect((await listStickers(kid.id)).map((a) => a.id).sort()).toEqual(['c', 's']);
  });
});
