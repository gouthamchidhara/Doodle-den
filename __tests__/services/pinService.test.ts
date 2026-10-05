// PIN set/verify and 3-strike cooldown (T-009).
import { COOLDOWN_MS, getCooldownMs, hasPin, isValidPin, setPin, verifyPin, clearPin } from '@/services/pinService';
import { newId } from '@/utils/ids';

import { secureStoreData } from '../helpers/mockNative';

jest.mock('expo-secure-store', () => jest.requireActual('../helpers/mockNative').secureStoreMock);
jest.mock('expo-crypto', () => jest.requireActual('../helpers/mockNative').cryptoMock);

beforeEach(() => secureStoreData.clear());

describe('pinService', () => {
  it('validates PIN format', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('sets and verifies a PIN with a salted hash', async () => {
    expect(await hasPin()).toBe(false);
    expect(await verifyPin('1234')).toEqual({ ok: false, reason: 'no_pin' });
    await setPin('1234');
    expect(await hasPin()).toBe(true);
    expect(secureStoreData.get('dd.pin.salt')).toMatch(/^[0-9a-f]{32}$/);
    expect(secureStoreData.get('dd.pin.hash')).toMatch(/^[0-9a-f]{64}$/);
    expect(secureStoreData.get('dd.pin.hash')).not.toContain('1234');
    expect(await verifyPin('1234')).toEqual({ ok: true });
    await expect(setPin('12')).rejects.toThrow();
  });

  it('3 wrong in a row -> 60 s cooldown, then retry works', async () => {
    await setPin('4321');
    const t0 = 1_000_000;
    expect(await verifyPin('0000', t0)).toEqual({ ok: false, reason: 'wrong', attemptsLeft: 2 });
    expect(await verifyPin('1111', t0)).toEqual({ ok: false, reason: 'wrong', attemptsLeft: 1 });
    expect(await verifyPin('2222', t0)).toEqual({ ok: false, reason: 'cooldown', retryInMs: COOLDOWN_MS });
    expect(await verifyPin('4321', t0 + 10_000)).toEqual({ ok: false, reason: 'cooldown', retryInMs: 50_000 });
    expect(await getCooldownMs(t0 + 30_000)).toBe(30_000);
    expect(await getCooldownMs(t0 + 61_000)).toBe(0);
    expect(await verifyPin('4321', t0 + 61_000)).toEqual({ ok: true });
  });

  it('a correct PIN resets the strike count', async () => {
    await setPin('4321');
    await verifyPin('0000', 1);
    await verifyPin('0000', 1);
    expect(await verifyPin('4321', 1)).toEqual({ ok: true });
    expect(await verifyPin('0000', 1)).toEqual({ ok: false, reason: 'wrong', attemptsLeft: 2 });
  });

  it('clearPin removes everything; newId returns uuids', async () => {
    await setPin('4321');
    await clearPin();
    expect(secureStoreData.size).toBe(0);
    expect(newId()).toMatch(/^[0-9a-f-]{36}$/);
  });
});
