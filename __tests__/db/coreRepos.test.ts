// Repository tests on a real in-memory SQLite DB (T-007).
import { setDbForTesting } from '@/db/database';
import { MIGRATIONS, runMigrations, splitPragmas } from '@/db/migrations';
import * as artworkRepo from '@/db/repositories/artworkRepo';
import * as colorRepo from '@/db/repositories/colorRepo';
import * as kidRepo from '@/db/repositories/kidRepo';
import * as metaRepo from '@/db/repositories/metaRepo';
import * as progressRepo from '@/db/repositories/progressRepo';
import * as rewardRepo from '@/db/repositories/rewardRepo';
import * as rulesRepo from '@/db/repositories/rulesRepo';
import * as usageRepo from '@/db/repositories/usageRepo';
import type { Db } from '@/db/types';
import type { Artwork } from '@/types/models';

import { createTestDb } from '../helpers/nodeDb';

let mockCounter = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockCounter}` }));

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
  setDbForTesting(db);
});

const queued = async () => db.all<{ table_name: string; row_key: string; op: string }>('SELECT table_name, row_key, op FROM sync_queue ORDER BY id');

describe('migrations', () => {
  it('sets user_version to the latest migration and is idempotent', async () => {
    expect((await db.get<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(MIGRATIONS.length);
    await expect(runMigrations(db)).resolves.toBe(MIGRATIONS.length);
    expect((await db.get<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(2);
  });
  it('separates PRAGMA lines from the body', () => {
    const { pragmas, body } = splitPragmas(MIGRATIONS[0]);
    expect(pragmas).toEqual(['PRAGMA journal_mode = WAL;', 'PRAGMA foreign_keys = ON;']);
    expect(body).not.toMatch(/PRAGMA/);
  });
});

describe('kidRepo', () => {
  it('creates, lists, updates and deletes kids with default rules', async () => {
    const kid = await kidRepo.createKid({ nickname: '  Mia the Great Artist ', avatarId: 'fox', ageMode: 'big' });
    expect(kid.nickname).toBe('Mia the Grea');
    expect(await kidRepo.listKids()).toHaveLength(1);
    expect((await rulesRepo.getRules(kid.id)).dailyLimitMin).toBe(45);
    const updated = await kidRepo.updateKid(kid.id, { ageMode: 'little' });
    expect(updated?.ageMode).toBe('little');
    expect((await kidRepo.getKid(kid.id))?.ageMode).toBe('little');
    await kidRepo.deleteKid(kid.id);
    expect(await kidRepo.getKid(kid.id)).toBeNull();
    expect(await db.get('SELECT * FROM time_rule WHERE kid_id = ?', [kid.id])).toBeNull();
    expect((await queued()).map((q) => `${q.table_name}:${q.op}`)).toEqual([
      'kid_profile:upsert',
      'time_rule:upsert',
      'kid_profile:upsert',
      'kid_profile:delete',
    ]);
  });
  it('updateKid returns null for unknown id', async () => {
    expect(await kidRepo.updateKid('nope', { nickname: 'x' })).toBeNull();
  });
});

describe('rulesRepo', () => {
  it('returns defaults when missing and saves normalized values', async () => {
    expect(await rulesRepo.getRules('ghost')).toEqual(rulesRepo.defaultRules('ghost'));
    const kid = await kidRepo.createKid({ nickname: 'Leo', avatarId: 'bear', ageMode: 'little' });
    const saved = await rulesRepo.saveRules({ ...rulesRepo.defaultRules(kid.id), dailyLimitMin: 33, sessionLimitMin: 200, cooldownMin: 50, breakReminderMin: 17 });
    expect(saved).toMatchObject({ dailyLimitMin: 35, sessionLimitMin: 35, cooldownMin: 45, breakReminderMin: null });
    expect(await rulesRepo.getRules(kid.id)).toEqual(saved);
  });
  it('normalizes ranges', () => {
    const r = rulesRepo.normalizeRules({ ...rulesRepo.defaultRules('k'), dailyLimitMin: 500, sessionLimitMin: 1, bedtimeStart: '25:00', breakReminderMin: 20 });
    expect(r).toMatchObject({ dailyLimitMin: 180, sessionLimitMin: 5, bedtimeStart: '19:30', breakReminderMin: 20 });
  });
});

describe('usageRepo', () => {
  it('adds usage, sessions, extensions and builds a zero-filled week', async () => {
    const kid = await kidRepo.createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    expect(await usageRepo.getUsageDay(kid.id, '2026-10-05')).toMatchObject({ usedSec: 0, sessions: 0 });
    await usageRepo.addUsage(kid.id, '2026-10-05', 60, 'draw');
    await usageRepo.addUsage(kid.id, '2026-10-05', 30, 'draw');
    await usageRepo.addUsage(kid.id, '2026-10-05', 15, null);
    await usageRepo.addUsage(kid.id, '2026-10-05', 0, 'draw');
    await usageRepo.incrementSessions(kid.id, '2026-10-05');
    await usageRepo.incrementExtensions(kid.id, '2026-10-05');
    await usageRepo.addUsage(kid.id, '2026-10-01', 120, 'trace');
    const day = await usageRepo.getUsageDay(kid.id, '2026-10-05');
    expect(day).toMatchObject({ usedSec: 105, sessions: 1, extensionsUsed: 1, perActivitySec: { draw: 90 } });
    const week = await usageRepo.getWeek(kid.id, '2026-10-05');
    expect(week.map((d) => d.dayKey)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']);
    expect(week.map((d) => d.usedSec)).toEqual([0, 0, 120, 0, 0, 0, 105]);
  });
});

const art = (kidId: string, id: string, createdAt: number, extra: Partial<Artwork> = {}): Artwork => ({
  id,
  kidId,
  activity: 'draw',
  title: null,
  pngPath: `art/${kidId}/${id}.png`,
  thumbPath: `art/${kidId}/${id}.thumb.png`,
  strokesPath: `art/${kidId}/${id}.strokes.json`,
  durationSec: 12.4,
  createdAt,
  updatedAt: createdAt,
  isFavorite: false,
  isSticker: false,
  trashedAt: null,
  ...extra,
});

describe('artworkRepo', () => {
  it('saves, lists, favorites, trashes, restores and empties trash', async () => {
    const kid = await kidRepo.createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    await artworkRepo.saveArtwork(art(kid.id, 'a1', 1000));
    await artworkRepo.saveArtwork(art(kid.id, 'a2', 2000));
    await artworkRepo.saveArtwork(art(kid.id, 'f1', 3000, { activity: 'flipbook_frame' }));
    expect((await artworkRepo.listArtworks(kid.id)).map((a) => a.id)).toEqual(['f1', 'a2', 'a1']);
    expect((await artworkRepo.listArtworks(kid.id, { excludeActivities: ['flipbook_frame'] })).map((a) => a.id)).toEqual(['a2', 'a1']);
    expect(await artworkRepo.countArtworks(kid.id)).toBe(2);
    expect(await artworkRepo.toggleFavorite('a1')).toBe(true);
    expect((await artworkRepo.listArtworks(kid.id, { favoritesOnly: true })).map((a) => a.id)).toEqual(['a1']);
    await artworkRepo.trashArtwork('a2');
    expect((await artworkRepo.listArtworks(kid.id)).map((a) => a.id)).toEqual(['f1', 'a1']);
    expect((await artworkRepo.listArtworks(kid.id, { includeTrashed: true })).length).toBe(3);
    await artworkRepo.restoreArtwork('a2');
    await artworkRepo.trashArtwork('a2');
    const emptied = await artworkRepo.emptyTrash(kid.id);
    expect(emptied.map((a) => a.id)).toEqual(['a2']);
    expect(await artworkRepo.getArtwork('a2')).toBeNull();
    await artworkRepo.setSticker('a1', 'art/x/a1.sticker.png');
    expect((await artworkRepo.listStickers(kid.id)).map((a) => [a.id, a.stickerPath])).toEqual([['a1', 'art/x/a1.sticker.png']]);
    await artworkRepo.setFamilyShared('a1', true);
    expect((await artworkRepo.getArtwork('a1'))?.familyShared).toBe(true);
    expect(await artworkRepo.toggleFavorite('missing')).toBe(false);
  });
});

describe('progress, reward, color, meta repos', () => {
  it('works end to end', async () => {
    const kid = await kidRepo.createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    await progressRepo.setSkill(kid.id, 'trace_A', 2);
    await progressRepo.setSkill(kid.id, 'trace_A', 3);
    expect(await progressRepo.getProgress(kid.id)).toMatchObject([{ skill: 'trace_A', level: 3 }]);
    expect(await rewardRepo.grantReward(kid.id, 'first_drawing')).toBe(true);
    expect(await rewardRepo.grantReward(kid.id, 'first_drawing')).toBe(false);
    expect((await rewardRepo.listRewards(kid.id)).map((r) => r.rewardId)).toEqual(['first_drawing']);
    const c = await colorRepo.addCustomColor(kid.id, '#a1b2c3', 'Dragon Goo');
    expect(c?.hex).toBe('#A1B2C3');
    expect(await colorRepo.listCustomColors(kid.id)).toHaveLength(1);
    for (let i = 0; i < 23; i += 1) await colorRepo.addCustomColor(kid.id, '#000000', `c${i}`);
    expect(await colorRepo.addCustomColor(kid.id, '#111111', 'full')).toBeNull();
    await colorRepo.deleteCustomColor(c!.id);
    expect(await colorRepo.listCustomColors(kid.id)).toHaveLength(23);
    expect(await metaRepo.getMeta('onboarding_done')).toBeNull();
    await metaRepo.setMeta('onboarding_done', 'true');
    await metaRepo.setMeta('onboarding_done', 'false');
    expect(await metaRepo.getMeta('onboarding_done')).toBe('false');
    await metaRepo.deleteMeta('onboarding_done');
    expect(await metaRepo.getMeta('onboarding_done')).toBeNull();
  });
});
