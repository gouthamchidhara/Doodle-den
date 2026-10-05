// T-035: lock screen text per reason, idea rotation, unlock sheet after the Parent Gate.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHandler } from 'react-native';

import { pickOffScreenIdeas } from '@/content/offScreenIdeas';
import { createLockState } from '@/lock/lockEngine';
import { lockController } from '@/lock/lockRuntime';
import { useLockStore } from '@/lock/lockStore';
import type { LockState } from '@/lock/types';
import { backText, lockHeadline } from '@/screens/lock/lockText';
import { LockScreen } from '@/screens/LockScreen';
import { useParentStore } from '@/state/parentStore';
import type { TimeRules } from '@/types/models';

jest.mock('@/lock/lockRuntime', () => ({ lockController: { parentUnlock: jest.fn(async () => undefined) } }));

const rules: TimeRules = {
  kidId: 'k',
  dailyLimitMin: 45,
  sessionLimitMin: 20,
  cooldownMin: 30,
  bedtimeEnabled: true,
  bedtimeStart: '19:30',
  bedtimeEnd: '07:00',
  breakReminderMin: null,
  finishDrawingExtensionSec: 120,
  maxExtensionsPerSession: 1,
};
const locked = (reason: LockState['lock']['reason'], untilWallMs: number | null): LockState => ({
  ...createLockState('k', { uptimeMs: 0, bootId: 'b', wallMs: 0, serverOffsetMs: null }),
  lock: { reason, untilWallMs },
});

describe('lock text', () => {
  it('headline and return time per reason', () => {
    expect(lockHeadline('cooldown')).toBe('Break time! The crayons are resting');
    expect(lockHeadline('daily')).toBe('The crayons are sleeping now');
    expect(lockHeadline('parent')).toBe('A grown-up paused play');
    expect(backText(locked('cooldown', 10 * 60_000), rules, 0)).toBe('Back in 10 minutes');
    expect(backText(locked('daily', 1), rules, 0)).toBe('Back tomorrow');
    expect(backText(locked('bedtime', 1), rules, 0)).toMatch(/^Back at 7:00/);
  });

  it('rotates three ideas out of twelve', () => {
    const a = pickOffScreenIdeas(0);
    const b = pickOffScreenIdeas(1);
    expect(a).toHaveLength(3);
    expect(a[0].id).not.toBe(b[0].id);
    expect(pickOffScreenIdeas(4)).toEqual(a);
  });
});

describe('LockScreen', () => {
  beforeEach(() => useLockStore.getState().set(locked('daily', Date.now() + 3_600_000), rules));

  it('shows the headline and blocks the Android back button', async () => {
    const spy = jest.spyOn(BackHandler, 'addEventListener');
    await render(<LockScreen />);
    expect(screen.getByText('The crayons are sleeping now')).toBeTruthy();
    expect(screen.getByText('Back tomorrow')).toBeTruthy();
    expect(spy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    await fireEvent(screen.getByLabelText('Grown-ups: hold to unlock'), 'longPress');
    expect(router.push).toHaveBeenCalledWith({ pathname: '/parent/gate', params: { next: '/locked?unlock=1' } });
  });

  it('after the gate, +15 min unlocks and goes Home', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ unlock: '1' });
    useParentStore.getState().unlock();
    await render(<LockScreen />);
    await fireEvent.press(screen.getByText('+15 min'));
    await waitFor(() => expect(lockController.parentUnlock).toHaveBeenCalledWith('plus15'));
    expect(router.replace).toHaveBeenCalledWith('/home');
  });
});
