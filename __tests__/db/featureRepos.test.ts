// Tests for v1 feature repositories (T-008).
import { setDbForTesting } from '@/db/database';
import * as aiResultRepo from '@/db/repositories/aiResultRepo';
import * as artworkRepo from '@/db/repositories/artworkRepo';
import * as flipbookRepo from '@/db/repositories/flipbookRepo';
import * as jigsawRepo from '@/db/repositories/jigsawRepo';
import * as kidRepo from '@/db/repositories/kidRepo';
import * as museumRepo from '@/db/repositories/museumRepo';
import * as musicRepo from '@/db/repositories/musicRepo';
import * as storyRepo from '@/db/repositories/storyRepo';
import * as voiceRepo from '@/db/repositories/voiceRepo';
import * as worldRepo from '@/db/repositories/worldRepo';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

let kidId = '';
beforeEach(async () => {
  setDbForTesting(await createTestDb());
  kidId = (await kidRepo.createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' })).id;
  for (const id of ['a1', 'a2', 'a3']) {
    await artworkRepo.saveArtwork({
      id, kidId, activity: 'world', title: null, pngPath: `${id}.png`, thumbPath: `${id}.t.png`, strokesPath: null,
      durationSec: 1, createdAt: 1, updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null,
    });
  }
});

it('worldRepo', async () => {
  await worldRepo.saveEntity({ id: 'w1', kidId, world: 'aquarium', artworkId: 'a1', name: 'Sunny', voiceClipId: null, createdAt: 1 });
  await worldRepo.saveEntity({ id: 'w2', kidId, world: 'zoo', artworkId: 'a2', name: null, voiceClipId: null, createdAt: 2 });
  expect((await worldRepo.listEntities(kidId, 'aquarium')).map((e) => e.id)).toEqual(['w1']);
  expect((await worldRepo.listAllEntities(kidId)).map((e) => e.id)).toEqual(['w2', 'w1']);
  await voiceRepo.saveClip({ id: 'v1', kidId, path: 'v1.m4a', preset: 'monster', durationMs: 900, createdAt: 3 });
  await worldRepo.saveEntity({ ...(await worldRepo.getEntity('w1'))!, voiceClipId: 'v1' });
  expect((await worldRepo.getEntityByArtwork('a1'))?.voiceClipId).toBe('v1');
  await worldRepo.deleteEntity('w2');
  expect(await worldRepo.getEntity('w2')).toBeNull();
  await artworkRepo.emptyTrash(kidId);
});

it('voiceRepo', async () => {
  await voiceRepo.saveClip({ id: 'v1', kidId, path: 'v1.m4a', preset: 'chipmunk', durationMs: 1000, createdAt: 1 });
  expect(await voiceRepo.listClips(kidId)).toHaveLength(1);
  expect((await voiceRepo.getClip('v1'))?.preset).toBe('chipmunk');
  await voiceRepo.deleteClip('v1');
  expect(await voiceRepo.getClip('v1')).toBeNull();
});

it('flipbookRepo', async () => {
  await flipbookRepo.saveFlipbook({ id: 'f1', kidId, frameIds: ['a1', 'a2', 'a3'], fps: 8, createdAt: 1, updatedAt: 1 });
  expect((await flipbookRepo.getFlipbook('f1'))?.frameIds).toEqual(['a1', 'a2', 'a3']);
  expect((await flipbookRepo.getFlipbookByFirstFrame('a1'))?.id).toBe('f1');
  expect(await flipbookRepo.listFlipbooks(kidId)).toHaveLength(1);
  await flipbookRepo.deleteFlipbook('f1');
  expect(await flipbookRepo.getFlipbook('f1')).toBeNull();
});

it('musicRepo', async () => {
  await musicRepo.saveMusic({ artworkId: 'a1', notesPath: 'a1.notes.json' });
  expect(await musicRepo.getMusic('a1')).toEqual({ artworkId: 'a1', notesPath: 'a1.notes.json' });
  expect(await musicRepo.listMusicArtworkIds()).toEqual(['a1']);
  await musicRepo.deleteMusic('a1');
  expect(await musicRepo.getMusic('a1')).toBeNull();
});

it('jigsawRepo keeps best time', async () => {
  expect(await jigsawRepo.saveResult({ kidId, artworkId: 'a1', pieces: 9, bestTimeSec: 80, completedAt: 1 })).toBe(true);
  expect(await jigsawRepo.saveResult({ kidId, artworkId: 'a1', pieces: 9, bestTimeSec: 95, completedAt: 2 })).toBe(false);
  expect(await jigsawRepo.saveResult({ kidId, artworkId: 'a1', pieces: 9, bestTimeSec: 60, completedAt: 3 })).toBe(true);
  expect((await jigsawRepo.getResult(kidId, 'a1', 9))?.bestTimeSec).toBe(60);
  expect(await jigsawRepo.listResults(kidId)).toHaveLength(1);
  await jigsawRepo.deleteResult(kidId, 'a1', 9);
  expect(await jigsawRepo.getResult(kidId, 'a1', 9)).toBeNull();
});

it('museumRepo, storyRepo, aiResultRepo', async () => {
  await museumRepo.saveExhibit({ id: 'm1', kidId, artworkIds: ['a1', 'a2', 'a3'], createdAt: 1 });
  expect((await museumRepo.getExhibit('m1'))?.artworkIds).toHaveLength(3);
  expect(await museumRepo.listExhibits(kidId)).toHaveLength(1);
  await museumRepo.deleteExhibit('m1');
  expect(await museumRepo.getExhibit('m1')).toBeNull();

  await storyRepo.saveStory({ id: 's1', kidId, title: 'Sunny Swims', pages: [{ artIndex: 0, text: 'Sunny swam.' }], artworkIds: ['a1'], createdAt: 1 });
  expect((await storyRepo.getStory('s1'))?.pages).toEqual([{ artIndex: 0, text: 'Sunny swam.' }]);
  expect(await storyRepo.listStories(kidId)).toHaveLength(1);
  await storyRepo.deleteStory('s1');
  expect(await storyRepo.getStory('s1')).toBeNull();

  await aiResultRepo.saveAiResult({ id: 'r1', kidId, feature: 'magic_sketch', sourceArtworkId: 'a1', outputArtworkId: 'a2', createdAt: 1 });
  expect((await aiResultRepo.getByOutputArtwork('a2'))?.id).toBe('r1');
  expect(await aiResultRepo.listAiResults(kidId, 'magic_sketch')).toHaveLength(1);
  expect(await aiResultRepo.listAiResults(kidId, 'story')).toHaveLength(0);
  expect(await aiResultRepo.listAiResults(kidId)).toHaveLength(1);
  await aiResultRepo.deleteAiResult('r1');
  expect(await aiResultRepo.getAiResult('r1')).toBeNull();
});
