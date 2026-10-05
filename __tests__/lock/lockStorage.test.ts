// T-032: lock state round-trips through secure-store; server offset is stored; session storage chunks.
import { setDbForTesting } from '@/db/database';
import { getMeta } from '@/db/repositories/metaRepo';
import { readClock } from '@/lock/clock';
import { createLockState } from '@/lock/lockEngine';
import { clearLockState, loadLockState, lockKey, saveLockState } from '@/lock/lockStorage';
import { useLockStore } from '@/lock/lockStore';
import { getServerOffset, loadServerOffset, SERVER_OFFSET_KEY, syncServerTime } from '@/lock/serverTime';
import { secureSessionStorage } from '@/services/supabase';
import type { TimeRules } from '@/types/models';

import { secureStoreData } from '../helpers/mockNative';
import { createTestDb } from '../helpers/nodeDb';

jest.mock('expo-secure-store', () => jest.requireActual('../helpers/mockNative').secureStoreMock);

const mockServerIso = { value: '' };
jest.mock('@/services/supabase', () => ({
  ...jest.requireActual('@/services/supabase'),
  getSupabase: () => ({ rpc: async () => ({ data: mockServerIso.value, error: null }) }),
}));

const clock = { uptimeMs: 5000, bootId: 'b', wallMs: Date.UTC(2026, 9, 5, 15), serverOffsetMs: null };

beforeEach(() => secureStoreData.clear());

describe('lockStorage', () => {
  it('round-trips state and rejects junk', async () => {
    const s = createLockState('kid-1', clock);
    s.usedTodaySec = 123;
    s.lock = { reason: 'cooldown', untilWallMs: 99 };
    await saveLockState(s);
    expect(await loadLockState('kid-1')).toEqual(s);
    secureStoreData.set(lockKey('kid-2'), '{"version":2}');
    expect(await loadLockState('kid-2')).toBeNull();
    await clearLockState('kid-1');
    expect(await loadLockState('kid-1')).toBeNull();
  });
});

describe('serverTime', () => {
  it('stores the offset in app_meta and uses it in readClock', async () => {
    setDbForTesting(await createTestDb());
    mockServerIso.value = new Date(Date.now() + 3_600_000).toISOString();
    const offset = await syncServerTime();
    expect(offset).toBeGreaterThan(3_590_000);
    expect(Number(await getMeta(SERVER_OFFSET_KEY))).toBe(offset);
    expect(await loadServerOffset()).toBe(offset);
    expect(getServerOffset()).toBe(offset);
    const c = readClock();
    expect(c.serverOffsetMs).toBe(offset);
    expect(c.bootId).toBe('no-native');
  });
});

describe('lockStore', () => {
  it('keeps remaining seconds and an event queue', () => {
    const rules: TimeRules = {
      kidId: 'kid-1',
      dailyLimitMin: 45,
      sessionLimitMin: 20,
      cooldownMin: 30,
      bedtimeEnabled: false,
      bedtimeStart: '19:30',
      bedtimeEnd: '07:00',
      breakReminderMin: null,
      finishDrawingExtensionSec: 120,
      maxExtensionsPerSession: 1,
    };
    useLockStore.getState().set(createLockState('kid-1', clock), rules);
    expect(useLockStore.getState().remainingSec).toBe(1200);
    useLockStore.getState().pushEvents(['WARN_5', 'BREAK']);
    expect(useLockStore.getState().takeEvents()).toEqual(['WARN_5', 'BREAK']);
    expect(useLockStore.getState().events).toEqual([]);
  });
});

describe('secureSessionStorage', () => {
  it('splits long values into chunks', async () => {
    const long = 'x'.repeat(5000);
    await secureSessionStorage.setItem('sb', long);
    expect(secureStoreData.get('sb.n')).toBe('3');
    expect(await secureSessionStorage.getItem('sb')).toBe(long);
    await secureSessionStorage.removeItem('sb');
    expect(await secureSessionStorage.getItem('sb')).toBeNull();
  });
});
