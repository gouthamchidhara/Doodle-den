// Deno tests (A7 Required tests): guard codes, cap counting.
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { AiError } from './contract.ts';
import type { GuardDeps } from './deps.ts';
import { capWindowStart, guard } from './guard.ts';

function fake(over: Partial<GuardDeps> & { used?: number; free?: boolean; entitled?: boolean; consent?: boolean } = {}): GuardDeps & { logged: string[] } {
  const logged: string[] = [];
  return {
    logged,
    userIdFromToken: async (t) => (t === 'good' ? 'u1' : null),
    familyForUser: async () => ({ id: 'f1', ai_entitled: over.entitled ?? false }),
    hasConsent: async () => over.consent ?? true,
    config: async <T,>(k: string) => (k === 'ai_free_for_all' ? (over.free ?? true) : { guess: 2, digest: 1 }) as T,
    countUsage: async () => over.used ?? 0,
    logUsage: async (_f, _feat, status) => {
      logged.push(status);
    },
    ...over,
  };
}

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return e instanceof AiError ? e.code : 'THROW';
  }
};

Deno.test('guard returns each code', async () => {
  assertEquals(await code(guard(fake(), null, 'guess')), 'UNAUTHORIZED');
  assertEquals(await code(guard(fake(), 'Bearer bad', 'guess')), 'UNAUTHORIZED');
  assertEquals(await code(guard(fake({ familyForUser: async () => null }), 'Bearer good', 'guess')), 'UNAUTHORIZED');
  assertEquals(await code(guard(fake({ consent: false }), 'Bearer good', 'guess')), 'NEEDS_CONSENT');
  assertEquals(await code(guard(fake({ free: false }), 'Bearer good', 'guess')), 'NEEDS_PLAN');
  assertEquals(await code(guard(fake({ free: false, entitled: true }), 'Bearer good', 'guess')), 'OK');
  const d = fake({ used: 2 });
  assertEquals(await code(guard(d, 'Bearer good', 'guess')), 'CAP_REACHED');
  assertEquals(d.logged, ['cap']);
  assertEquals(await code(guard(fake({ used: 1 }), 'Bearer good', 'guess')), 'OK');
  await assertRejects(() => guard(fake({ used: 5 }), 'Bearer good', 'coach'));
});

Deno.test('cap window: UTC day, digest 7 days', () => {
  const now = new Date('2026-10-05T15:30:00Z');
  assertEquals(capWindowStart('guess', now), '2026-10-05T00:00:00.000Z');
  assertEquals(capWindowStart('digest', now), '2026-09-28T15:30:00.000Z');
});
