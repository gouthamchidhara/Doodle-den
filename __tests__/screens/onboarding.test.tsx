// Onboarding: PIN entry twice, mismatch shake, finish → kid home (T-012).
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { stepValue } from '@/components/parent/Stepper';
import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { getMeta } from '@/db/repositories/metaRepo';
import { CreatePinScreen } from '@/screens/onboarding/CreatePinScreen';
import { finishOnboarding, isOnboardingDone, saveStep, setOnboardingKid } from '@/services/onboarding';
import { verifyPin } from '@/services/pinService';
import { decideStartRoute, loadStartupState } from '@/services/startup';
import { useSessionStore } from '@/state/sessionStore';

import { secureStoreData } from '../helpers/mockNative';
import { createTestDb } from '../helpers/nodeDb';

jest.mock('expo-secure-store', () => jest.requireActual('../helpers/mockNative').secureStoreMock);
jest.mock('expo-crypto', () => jest.requireActual('../helpers/mockNative').cryptoMock);

beforeEach(async () => {
  secureStoreData.clear();
  setDbForTesting(await createTestDb());
  jest.clearAllMocks();
});

const typePin = async (pin: string) => {
  for (const d of pin) await fireEvent.press(screen.getByLabelText(d));
};

describe('onboarding', () => {
  it('create-pin: matching PINs are saved and move on', async () => {
    await render(<CreatePinScreen />);
    await typePin('2468');
    expect(screen.getByText('Enter it again')).toBeTruthy();
    await typePin('2468');
    expect(router.push).toHaveBeenCalledWith('/onboarding/add-kid');
    expect(await verifyPin('2468')).toEqual({ ok: true });
  });

  it("create-pin: mismatch shows PINs don't match and starts over", async () => {
    await render(<CreatePinScreen />);
    await typePin('1111');
    await typePin('2222');
    expect(screen.getByText("PINs don't match")).toBeTruthy();
    expect(screen.getByText('Create a grown-up PIN')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('resume + finish: cannot run twice, kid becomes active', async () => {
    await saveStep('time-rules');
    expect(decideStartRoute(await loadStartupState(async () => false))).toBe('/onboarding/time-rules');
    const kid = await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'little' });
    await setOnboardingKid(kid.id);
    await finishOnboarding();
    expect(await isOnboardingDone()).toBe(true);
    expect(await getMeta('active_kid_id')).toBe(kid.id);
    expect(useSessionStore.getState()).toMatchObject({ activeKidId: kid.id, ageMode: 'little' });
    expect(decideStartRoute(await loadStartupState(async () => false))).toBe('/home');
  });

  it('stepper clamps and wraps', () => {
    expect(stepValue(180, 5, 10, 180)).toBe(180);
    expect(stepValue(10, -5, 10, 180)).toBe(10);
    expect(stepValue(1425, 15, 0, 1425, true)).toBe(0);
    expect(stepValue(0, -15, 0, 1425, true)).toBe(1425);
  });
});
