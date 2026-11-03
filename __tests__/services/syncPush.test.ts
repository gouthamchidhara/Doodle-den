import { artStoragePath, base64ToBytes, mergeUsage } from '@/services/syncPush';

jest.mock('@/services/files', () => ({ readBase64: jest.fn() }));

describe('syncPush helpers', () => {
  const local = { kidId: 'k', dayKey: '2026-11-03', usedSec: 300, sessions: 1, extensionsUsed: 0, perActivitySec: {} };
  it('takes MAX of usage counters', () => {
    expect(mergeUsage(local, { used_sec: 900, sessions: 0, extensions_used: 1 })).toEqual({ used_sec: 900, sessions: 1, extensions_used: 1 });
    expect(mergeUsage(local, null)).toEqual({ used_sec: 300, sessions: 1, extensions_used: 0 });
  });
  it('builds storage paths and decodes base64', () => {
    expect(artStoragePath('f', 'k', 'a')).toBe('f/k/a.png');
    expect(Array.from(base64ToBytes('AQID'))).toEqual([1, 2, 3]);
  });
});
