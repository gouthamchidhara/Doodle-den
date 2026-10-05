// T-033: 2-minute session → warnings, autosave before lock, force-quit + reopen stays locked, usage written.
import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { defaultRules, saveRules } from '@/db/repositories/rulesRepo';
import { getUsageDay } from '@/db/repositories/usageRepo';
import { activityForSegments } from '@/lock/activityForRoute';
import { LockController } from '@/lock/lockController';
import { isAllowedWhileLocked } from '@/lock/LockGate';
import { useLockStore } from '@/lock/lockStore';
import type { ClockReading } from '@/lock/types';
import { localDayKey } from '@/utils/time';

import { secureStoreData } from '../helpers/mockNative';
import { createTestDb } from '../helpers/nodeDb';

jest.mock('expo-secure-store', () => jest.requireActual('../helpers/mockNative').secureStoreMock);
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

let clock: ClockReading;
const readClock = () => clock;
const advance = (ms: number) => (clock = { ...clock, uptimeMs: clock.uptimeMs + ms, wallMs: clock.wallMs + ms });

async function setup() {
  secureStoreData.clear();
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Lu', avatarId: 'fox', ageMode: 'big' });
  await saveRules({ ...defaultRules(kid.id), sessionLimitMin: 5, dailyLimitMin: 45, bedtimeEnabled: false });
  clock = { uptimeMs: 1000, bootId: 'b1', wallMs: new Date(2026, 9, 5, 10).getTime(), serverOffsetMs: null };
  return kid.id;
}

describe('LockController', () => {
  it('warns, autosaves, then locks; reopening stays locked', async () => {
    const kidId = await setup();
    const order: string[] = [];
    const effects = {
      autosave: jest.fn(async () => {
        order.push('autosave');
      }),
      goLocked: jest.fn(() => order.push('locked')),
      goHome: jest.fn(),
    };
    const c = new LockController(effects, readClock);
    expect(await c.start(kidId)).toBe(false);
    const all: string[] = [];
    for (let i = 0; i < 5 * 60; i += 1) {
      advance(1000);
      all.push(...(await c.step(true, 'draw')));
    }
    expect(all).toEqual(expect.arrayContaining(['SESSION_START', 'WARN_5', 'WARN_1', 'AUTOSAVE', 'LOCK']));
    expect(order).toEqual(['autosave', 'locked']);
    expect(c.isLocked()).toBe(true);
    expect(useLockStore.getState().events).toEqual(['WARN_5', 'WARN_1']);

    const reopened = new LockController(effects, readClock);
    advance(5000);
    expect(await reopened.start(kidId)).toBe(true);

    const day = await getUsageDay(kidId, localDayKey(clock.wallMs));
    expect(day.usedSec).toBe(300);
    expect(day.sessions).toBe(1);
    expect(day.perActivitySec.draw).toBe(300);
  });

  it('finish-drawing extension is granted once in the last minute', async () => {
    const kidId = await setup();
    const c = new LockController({ autosave: async () => undefined, goLocked: jest.fn(), goHome: jest.fn() }, readClock);
    await c.start(kidId);
    for (let i = 0; i < 4 * 60 + 10; i += 1) {
      advance(1000);
      await c.step(true);
    }
    expect(await c.finishDrawing()).toBe(true);
    expect(await c.finishDrawing()).toBe(false);
    expect((await getUsageDay(kidId, localDayKey(clock.wallMs))).extensionsUsed).toBe(1);
  });
});

describe('routing helpers', () => {
  it('maps routes to activities and allows parent/lock routes', () => {
    expect(activityForSegments(['(kid)', 'aquarium'])).toBe('world');
    expect(activityForSegments(['(kid)', 'home'])).toBeNull();
    expect(isAllowedWhileLocked(['parent', 'gate'])).toBe(true);
    expect(isAllowedWhileLocked(['(kid)', 'draw'])).toBe(false);
  });
});
