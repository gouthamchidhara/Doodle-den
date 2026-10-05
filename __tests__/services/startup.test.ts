// Startup routing rules 1-5 with seeded DB states (T-011).
import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { decideStartRoute, loadStartupState } from '@/services/startup';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `kid-${++mockN}` }));

const notLocked = async () => false;
const route = async (isLocked = notLocked) => decideStartRoute(await loadStartupState(isLocked));

beforeEach(async () => setDbForTesting(await createTestDb()));

describe('startup routing', () => {
  it('fresh install → onboarding welcome', async () => {
    expect(await route()).toBe('/onboarding/welcome');
  });
  it('resumes onboarding at the saved step', async () => {
    await setMeta('onboarding_step', 'add-kid');
    expect(await route()).toBe('/onboarding/add-kid');
    await setMeta('onboarding_step', 'bogus');
    expect(await route()).toBe('/onboarding/welcome');
  });
  it('locked → /locked', async () => {
    await setMeta('onboarding_done', 'true');
    await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    expect(await route(async () => true)).toBe('/locked');
  });
  it('one kid → home and becomes active', async () => {
    await setMeta('onboarding_done', 'true');
    const kid = await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    expect(await route()).toBe('/home');
    expect(await getMeta('active_kid_id')).toBe(kid.id);
  });
  it('two kids, no active → profiles; with active → home', async () => {
    await setMeta('onboarding_done', 'true');
    await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    const leo = await createKid({ nickname: 'Leo', avatarId: 'bear', ageMode: 'little' });
    expect(await route()).toBe('/profiles');
    await setMeta('active_kid_id', leo.id);
    const s = await loadStartupState(notLocked);
    expect(s.activeKid?.nickname).toBe('Leo');
    expect(decideStartRoute(s)).toBe('/home');
  });
});
