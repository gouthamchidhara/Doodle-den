// T-024: artwork saving writes files first, then the DB row; a failed insert deletes the files.
import { parseStrokeDoc, saveArtworkFiles } from '@/canvas/saveArtwork';
import { setDbForTesting } from '@/db/database';
import * as artworkRepo from '@/db/repositories/artworkRepo';
import * as kidRepo from '@/db/repositories/kidRepo';
import { artPaths, readText } from '@/services/files';
import type { StrokeDoc } from '@/types/models';

import { createTestDb } from '../helpers/nodeDb';
import { fsData } from '../helpers/mockFs';

let mockCounter = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockCounter}` }));

const doc: StrokeDoc = {
  version: 1,
  aspect: 1.5,
  background: 'white',
  strokes: [{ id: 's1', tool: 'crayon', color: 'tomato', size: 'M', points: [{ x: 0.1, y: 0.1, p: 0.5, t: 0 }] }],
};
const exportPng = jest.fn(async (longEdge: number) => `png-${longEdge}`);

let kidId: string;
beforeEach(async () => {
  fsData.clear();
  setDbForTesting(await createTestDb());
  kidId = (await kidRepo.createKid({ nickname: 'Mo', avatarId: 'fox', ageMode: 'big' })).id;
});

describe('saveArtworkFiles', () => {
  it('writes PNG 2048, thumb 400 and strokes JSON, then the row', async () => {
    const id = await saveArtworkFiles({ kidId, activity: 'draw', doc, exportPng, durationSec: 12 });
    const p = artPaths(kidId, id);
    expect(fsData.get(`file:///doc/${p.png}`)).toBe('png-2048');
    expect(fsData.get(`file:///doc/${p.thumb}`)).toBe('png-400');
    expect(parseStrokeDoc(await readText(p.strokes))).toEqual(doc);
    const row = await artworkRepo.getArtwork(id);
    expect(row?.pngPath).toBe(p.png);
    expect(row?.durationSec).toBe(12);
  });

  it('later saves overwrite the same files and keep createdAt', async () => {
    const id = await saveArtworkFiles({ kidId, activity: 'draw', doc, exportPng, durationSec: 5 });
    const first = await artworkRepo.getArtwork(id);
    const id2 = await saveArtworkFiles({ kidId, activity: 'draw', artworkId: id, doc: { ...doc, strokes: [] }, exportPng, durationSec: 9 });
    expect(id2).toBe(id);
    const second = await artworkRepo.getArtwork(id);
    expect(second?.createdAt).toBe(first?.createdAt);
    expect(second?.durationSec).toBe(9);
    expect(await artworkRepo.countArtworks(kidId)).toBe(1);
  });

  it('deletes the files when the DB insert fails', async () => {
    const spy = jest.spyOn(artworkRepo, 'saveArtwork').mockRejectedValueOnce(new Error('db down'));
    await expect(saveArtworkFiles({ kidId, activity: 'draw', doc, exportPng, durationSec: 1 })).rejects.toThrow('db down');
    expect(fsData.size).toBe(0);
    spy.mockRestore();
  });

  it('deleting a kid deletes their art folder', async () => {
    await saveArtworkFiles({ kidId, activity: 'draw', doc, exportPng, durationSec: 1 });
    expect(fsData.size).toBe(3);
    await kidRepo.deleteKid(kidId);
    expect(fsData.size).toBe(0);
  });

  it('parseStrokeDoc rejects junk', () => {
    expect(parseStrokeDoc('nope')).toBeNull();
    expect(parseStrokeDoc('{"version":2}')).toBeNull();
    expect(parseStrokeDoc(null)).toBeNull();
  });
});
