// Lock state persistence in secure-store, one key per kid: dd.lock.<kidId> (A4).
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import type { LockState } from './types';

const schema = z.object({
  version: z.literal(1),
  kidId: z.string(),
  dayKey: z.string(),
  usedTodaySec: z.number(),
  extraTodaySec: z.number(),
  sessionActive: z.boolean(),
  sessionUsedSec: z.number(),
  extraSessionSec: z.number(),
  extensionsThisSession: z.number(),
  warned5: z.boolean(),
  warned1: z.boolean(),
  lastBreakAtSec: z.number(),
  lock: z.object({ reason: z.enum(['none', 'daily', 'cooldown', 'bedtime', 'parent']), untilWallMs: z.number().nullable() }),
  lastTick: z.object({ uptimeMs: z.number(), wallMs: z.number(), bootId: z.string() }),
  maxWallSeenMs: z.number(),
});

// Secure-store key for a kid's lock state.
export const lockKey = (kidId: string) => `dd.lock.${kidId}`;

// Loads a kid's saved state; null when missing or invalid.
export async function loadLockState(kidId: string): Promise<LockState | null> {
  try {
    const raw = await SecureStore.getItemAsync(lockKey(kidId));
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch (e) {
    console.warn('[lockStorage] load failed', e);
    return null;
  }
}

// Saves a kid's state.
export async function saveLockState(state: LockState): Promise<void> {
  try {
    await SecureStore.setItemAsync(lockKey(state.kidId), JSON.stringify(state));
  } catch (e) {
    console.warn('[lockStorage] save failed', e);
  }
}

// Removes a kid's state (profile deleted).
export async function clearLockState(kidId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(lockKey(kidId));
  } catch (e) {
    console.warn('[lockStorage] clear failed', e);
  }
}
