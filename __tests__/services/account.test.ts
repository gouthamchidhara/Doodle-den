// T-071 / T-097: magic-link URL parsing, family creation, delete-all wipes local data.
import { setDbForTesting } from '@/db/database';
import { createKid, listKids } from '@/db/repositories/kidRepo';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { authParams } from '@/screens/AuthCallbackScreen';
import { completeSignIn } from '@/services/auth';
import { deleteAllData } from '@/services/deleteAll';
import { hasPin, setPin } from '@/services/pinService';
import { setSupabaseForTesting } from '@/services/supabase';

import { secureStoreData } from '../helpers/mockNative';
import { createTestDb } from '../helpers/nodeDb';

jest.mock('expo-secure-store', () => jest.requireActual('../helpers/mockNative').secureStoreMock);
jest.mock('expo-crypto', () => jest.requireActual('../helpers/mockNative').cryptoMock);
jest.mock('@/lock/lockRuntime', () => ({ lockController: { stop: jest.fn(async () => undefined) } }));

describe('auth', () => {
  it('reads code or tokens from the link', () => {
    expect(authParams('doodleden://auth?code=abc&reset=pin')).toEqual({ code: 'abc', reset: 'pin' });
    expect(authParams('doodleden://auth#access_token=a&refresh_token=b')).toEqual({ access_token: 'a', refresh_token: 'b' });
  });

  it('creates the family row on first sign-in', async () => {
    setDbForTesting(await createTestDb());
    const insert = jest.fn(() => ({ select: () => ({ single: async () => ({ data: { id: 'fam-1' } }) }) }));
    const fake = {
      auth: { exchangeCodeForSession: async () => ({ error: null }), getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }), insert }),
    };
    setSupabaseForTesting(fake as never);
    expect(await completeSignIn({ code: 'c' })).toBe(true);
    expect(insert).toHaveBeenCalledWith({ parent_user_id: 'u1' });
    expect(await getMeta('family_id')).toBe('fam-1');
    setSupabaseForTesting(undefined);
  });
});

describe('deleteAllData', () => {
  it('wipes kids, meta and the PIN when signed out', async () => {
    secureStoreData.clear();
    setDbForTesting(await createTestDb());
    setSupabaseForTesting(null);
    await createKid({ nickname: 'Del', avatarId: 'fox', ageMode: 'big' });
    await setMeta('onboarding_done', '1');
    await setPin('1234');
    expect(await deleteAllData()).toBe(true);
    expect(await listKids()).toHaveLength(0);
    expect(await getMeta('onboarding_done')).toBeNull();
    expect(await hasPin()).toBe(false);
    setSupabaseForTesting(undefined);
  });
});
