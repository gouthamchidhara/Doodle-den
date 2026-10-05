// T-046: flipbook frames 3–8, delete limits, playback timing, saving frames + row.
import { setDbForTesting } from '@/db/database';
import { listArtworks } from '@/db/repositories/artworkRepo';
import { getFlipbook } from '@/db/repositories/flipbookRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { addFrame, canDelete, deleteFrame, frameAt, hasDrawing, newDraft, updateFrame } from '@/games/flipbook/flipbookModel';
import { saveFlipbookDraft } from '@/games/flipbook/saveFlipbook';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

const stroke = { id: 's', tool: 'crayon' as const, color: 'tomato', size: 'M' as const, points: [{ x: 0.1, y: 0.1, p: 0.5, t: 0 }] };

describe('flipbook model', () => {
  it('starts with 3 frames, grows to 8 and never deletes below 3', () => {
    let d = newDraft(1);
    expect(d.frames).toHaveLength(3);
    expect(canDelete(d)).toBe(false);
    for (let i = 0; i < 10; i += 1) d = addFrame(d);
    expect(d.frames).toHaveLength(8);
    d = deleteFrame(d, 7).draft;
    expect(d.frames).toHaveLength(7);
  });

  it('plays frames in a loop at the chosen speed', () => {
    expect(frameAt(0, 4, 3)).toBe(0);
    expect(frameAt(250, 4, 3)).toBe(1);
    expect(frameAt(750, 4, 3)).toBe(0);
    expect(frameAt(1000, 2, 5)).toBe(2);
    expect(frameAt(125, 8, 3)).toBe(1);
  });

  it('saves frames as hidden artworks plus one flipbook row', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Fi', avatarId: 'fox', ageMode: 'big' });
    let d = newDraft(1);
    expect(hasDrawing(d)).toBe(false);
    d = updateFrame(d, 0, { ...d.frames[0], strokes: [stroke] });
    const saved = await saveFlipbookDraft(kid.id, d, 4, null, null);
    expect(saved.frameIds).toHaveLength(3);
    expect((await getFlipbook(saved.id))?.fps).toBe(4);
    expect(await listArtworks(kid.id, { excludeActivities: ['flipbook_frame'] })).toHaveLength(0);
    expect(await listArtworks(kid.id, { activities: ['flipbook_frame'] })).toHaveLength(3);
    const again = await saveFlipbookDraft(kid.id, { ...d, frameIds: saved.frameIds }, 8, saved.id, 1);
    expect(again.frameIds).toEqual(saved.frameIds);
  });
});
