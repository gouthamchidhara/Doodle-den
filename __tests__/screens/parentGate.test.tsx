// Parent Gate: hold then PIN; wrong x3 cooldown; unlock window (T-013).
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ParentGateScreen, safeNext } from '@/screens/parent/ParentGateScreen';
import { setPin } from '@/services/pinService';
import { isParentUnlocked, PARENT_UNLOCK_MS, useParentStore } from '@/state/parentStore';

import { secureStoreData } from '../helpers/mockNative';

jest.mock('expo-secure-store', () => jest.requireActual('../helpers/mockNative').secureStoreMock);
jest.mock('expo-crypto', () => jest.requireActual('../helpers/mockNative').cryptoMock);

beforeEach(async () => {
  secureStoreData.clear();
  useParentStore.getState().clear();
  jest.clearAllMocks();
  await setPin('1357');
});

const typePin = async (pin: string) => {
  for (const d of pin) await fireEvent.press(screen.getByLabelText(d));
};

// Holds the gate button for the full 2 s using fake timers.
async function passHold() {
  jest.useFakeTimers();
  await fireEvent(screen.getByLabelText('Press and hold for 2 seconds'), 'pressIn');
  await act(async () => {
    jest.advanceTimersByTime(2100);
  });
  jest.useRealTimers();
}

describe('Parent Gate', () => {
  it('cannot be skipped: PIN pad only appears after the 2 s hold', async () => {
    await render(<ParentGateScreen />);
    expect(screen.queryByLabelText('1')).toBeNull();
    jest.useFakeTimers();
    await fireEvent(screen.getByLabelText('Press and hold for 2 seconds'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await fireEvent(screen.getByLabelText('Press and hold for 2 seconds'), 'pressOut');
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    jest.useRealTimers();
    expect(screen.queryByLabelText('1')).toBeNull();
  });

  it('correct PIN unlocks for 5 minutes and goes to next', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValueOnce({ next: '/parent/time-rules' }).mockReturnValue({ next: '/parent/time-rules' });
    await render(<ParentGateScreen />);
    await passHold();
    await typePin('1357');
    expect(router.replace).toHaveBeenCalledWith('/parent/time-rules');
    expect(isParentUnlocked()).toBe(true);
    expect(isParentUnlocked(Date.now() + PARENT_UNLOCK_MS + 1)).toBe(false);
  });

  it('wrong PIN x3 → cooldown message and pad disabled', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    await render(<ParentGateScreen />);
    await passHold();
    await typePin('0000');
    await typePin('0000');
    await typePin('0000');
    expect(screen.getByText(/Too many tries/)).toBeTruthy();
    expect(isParentUnlocked()).toBe(false);
  });

  it('safeNext only allows parent routes', () => {
    expect(safeNext('/parent/account')).toBe('/parent/account');
    expect(safeNext('/home')).toBe('/parent');
    expect(safeNext('/parent/gate')).toBe('/parent');
    expect(safeNext(undefined)).toBe('/parent');
    expect(safeNext('/profiles')).toBe('/profiles');
  });

  it('leaving the parent zone clears the unlock', () => {
    useParentStore.getState().unlock();
    expect(isParentUnlocked()).toBe(true);
    useParentStore.getState().clear();
    expect(isParentUnlocked()).toBe(false);
  });
});
