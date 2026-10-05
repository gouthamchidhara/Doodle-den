// T-048: each event grants the right rewards exactly once; toast queue spacing.
import { REWARDS, dailyDesign, getReward } from '@/content/rewards';
import { setDbForTesting } from '@/db/database';
import { saveArtwork } from '@/db/repositories/artworkRepo';
import { addCustomColor } from '@/db/repositories/colorRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { setSkill } from '@/db/repositories/progressRepo';
import { listRewards } from '@/db/repositories/rewardRepo';
import { saveEntity } from '@/db/repositories/worldRepo';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { nextToastDelay, TOAST_GAP_MS, useRewardStore } from '@/state/rewardStore';
import type { Artwork } from '@/types/models';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

let kidId: string;
beforeEach(async () => {
  setDbForTesting(await createTestDb());
  kidId = (await createKid({ nickname: 'Re', avatarId: 'fox', ageMode: 'big' })).id;
  useRewardStore.setState({ queue: [], lastShownAt: null });
});

const art = (id: string): Artwork => ({
  id,
  kidId,
  activity: 'draw',
  title: null,
  pngPath: 'p',
  thumbPath: 't',
  strokesPath: null,
  durationSec: 0,
  createdAt: 1,
  updatedAt: 1,
  isFavorite: false,
  isSticker: false,
  trashedAt: null,
});
const NOW = new Date(2026, 9, 5, 12).getTime();

describe('reward engine', () => {
  it('ARTWORK_SAVED: first drawing + today sticker once; 5 drawings later', async () => {
    await saveArtwork(art('a1'));
    expect(await checkRewards(kidId, 'ARTWORK_SAVED', { now: NOW })).toEqual(['first_drawing', 'day_2026-10-05']);
    expect(await checkRewards(kidId, 'ARTWORK_SAVED', { now: NOW })).toEqual([]);
    for (const id of ['a2', 'a3', 'a4', 'a5']) await saveArtwork(art(id));
    expect(await checkRewards(kidId, 'ARTWORK_SAVED', { now: NOW })).toEqual(['five_drawings']);
  });

  it('TRACE_COMPLETED: letter sticker, all letters when A–Z are done', async () => {
    await setSkill(kidId, 'trace_B', 2);
    expect(await checkRewards(kidId, 'TRACE_COMPLETED', { traceId: 'b' })).toEqual(['letter_B']);
    for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') await setSkill(kidId, `trace_${l}`, 1);
    expect(await checkRewards(kidId, 'TRACE_COMPLETED', { traceId: 'Z' })).toEqual(['letter_Z', 'all_letters']);
  });

  it('COLOR_NAMED counts colors; worlds, buckets, jigsaw, guided', async () => {
    await addCustomColor(kidId, '#123456', 'Sky Goo');
    expect(await checkRewards(kidId, 'COLOR_NAMED')).toEqual(['first_color']);
    await saveArtwork(art('fish'));
    await saveEntity({ id: 'e1', kidId, world: 'aquarium', artworkId: 'fish', name: null, voiceClipId: null, createdAt: 1 });
    expect(await checkRewards(kidId, 'WORLD_ENTITY_ADDED', { world: 'aquarium', fromPaper: true })).toEqual(['first_fish', 'first_paper']);
    expect(await checkRewards(kidId, 'RAMPS_BUCKET')).toEqual(['bucket_one']);
    expect(await checkRewards(kidId, 'RAMPS_BUCKET')).toEqual([]);
    expect(await checkRewards(kidId, 'JIGSAW_DONE', { pieces: 9 })).toEqual(['jigsaw_9']);
    expect(await checkRewards(kidId, 'GUIDED_DONE', { lessonId: 'cat' })).toEqual(['guided_cat']);
    expect((await listRewards(kidId)).length).toBe(6);
    expect(useRewardStore.getState().queue).toHaveLength(6);
  });

  it('catalog: unique ids, 10 bonus stamps, daily rotation', () => {
    expect(new Set(REWARDS.map((r) => r.id)).size).toBe(REWARDS.length);
    expect(REWARDS.filter((r) => r.bonusStamp)).toHaveLength(10);
    expect(getReward('day_2026-10-05')?.title).toBeTruthy();
    expect(dailyDesign('2026-01-01')).toBe(0);
    expect(dailyDesign('2026-01-31')).toBe(0);
  });

  it('toast queue shows at most one per 20 s', () => {
    useRewardStore.getState().push(['a', 'b']);
    expect(useRewardStore.getState().shift(1000)).toBe('a');
    expect(useRewardStore.getState().shift(5000)).toBeNull();
    expect(nextToastDelay(1000, 5000)).toBe(TOAST_GAP_MS - 4000);
    expect(useRewardStore.getState().shift(1000 + TOAST_GAP_MS)).toBe('b');
  });
});
