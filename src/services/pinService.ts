// Parent PIN: set, verify, and the 3-strikes / 60 s cooldown (A3 secure-store keys, A5 Parent Gate).
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { randomHex, safeEqual, sha256Hex } from '@/utils/hash';

export const PIN_HASH_KEY = 'dd.pin.hash';
export const PIN_SALT_KEY = 'dd.pin.salt';
export const GATE_FAILURES_KEY = 'dd.gate.failures';
export const MAX_FAILURES = 3;
export const COOLDOWN_MS = 60_000;

const failuresSchema = z.object({ count: z.number(), lockedUntilWall: z.number() });
type Failures = z.infer<typeof failuresSchema>;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attemptsLeft: number }
  | { ok: false; reason: 'cooldown'; retryInMs: number }
  | { ok: false; reason: 'no_pin' };

// True for exactly four digits.
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// Reads the failure counter (zeros on missing/bad data).
async function readFailures(): Promise<Failures> {
  try {
    const raw = await SecureStore.getItemAsync(GATE_FAILURES_KEY);
    if (!raw) return { count: 0, lockedUntilWall: 0 };
    return failuresSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.warn('[pinService] failures read failed', error);
    return { count: 0, lockedUntilWall: 0 };
  }
}

// Persists the failure counter.
async function writeFailures(f: Failures): Promise<void> {
  await SecureStore.setItemAsync(GATE_FAILURES_KEY, JSON.stringify(f));
}

// True when a parent PIN has been created.
export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_HASH_KEY)) !== null;
}

// Stores a new salted hash for a 4-digit PIN and clears failures.
export async function setPin(pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error('PIN must be 4 digits');
  const salt = randomHex(16);
  const hash = await sha256Hex(salt + pin);
  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await writeFailures({ count: 0, lockedUntilWall: 0 });
}

// Milliseconds left in the wrong-PIN cooldown (0 when none).
export async function getCooldownMs(nowWall: number = Date.now()): Promise<number> {
  const f = await readFailures();
  return Math.max(0, f.lockedUntilWall - nowWall);
}

// Checks a PIN; 3 wrong in a row starts a 60 s cooldown.
export async function verifyPin(pin: string, nowWall: number = Date.now()): Promise<VerifyResult> {
  const f = await readFailures();
  if (f.lockedUntilWall > nowWall) return { ok: false, reason: 'cooldown', retryInMs: f.lockedUntilWall - nowWall };
  const [salt, stored] = await Promise.all([SecureStore.getItemAsync(PIN_SALT_KEY), SecureStore.getItemAsync(PIN_HASH_KEY)]);
  if (!salt || !stored) return { ok: false, reason: 'no_pin' };
  const hash = await sha256Hex(salt + pin);
  if (isValidPin(pin) && safeEqual(hash, stored)) {
    await writeFailures({ count: 0, lockedUntilWall: 0 });
    return { ok: true };
  }
  const count = f.lockedUntilWall > 0 && f.lockedUntilWall <= nowWall ? 1 : f.count + 1;
  if (count >= MAX_FAILURES) {
    await writeFailures({ count: 0, lockedUntilWall: nowWall + COOLDOWN_MS });
    return { ok: false, reason: 'cooldown', retryInMs: COOLDOWN_MS };
  }
  await writeFailures({ count, lockedUntilWall: 0 });
  return { ok: false, reason: 'wrong', attemptsLeft: MAX_FAILURES - count };
}

// Removes the PIN and failures (used by "Delete all data").
export async function clearPin(): Promise<void> {
  await Promise.all([PIN_HASH_KEY, PIN_SALT_KEY, GATE_FAILURES_KEY].map((k) => SecureStore.deleteItemAsync(k)));
}
