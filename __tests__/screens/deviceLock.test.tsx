// T-036: Device lock parent screen — Android pin toggle, iOS Guided Access status and steps.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { isPinned, startPinning } from '@/lock/devicePinning';
import { DeviceLockScreen } from '@/screens/parent/DeviceLockScreen';

jest.mock('@/lock/devicePinning', () => ({
  isPinned: jest.fn(() => false),
  startPinning: jest.fn(async () => true),
  stopPinning: jest.fn(async () => undefined),
}));

const setOS = (os: 'ios' | 'android') => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

describe('DeviceLockScreen', () => {
  it('Android: toggle starts pinning', async () => {
    setOS('android');
    await render(<DeviceLockScreen />);
    await fireEvent(screen.getByLabelText('Keep my child in the app'), 'valueChange', true);
    expect(startPinning).toHaveBeenCalled();
  });

  it('iOS: shows Guided Access state and steps, no extra lock when the flag is off', async () => {
    setOS('ios');
    jest.mocked(isPinned).mockReturnValue(true);
    await render(<DeviceLockScreen />);
    expect(screen.getByText('Guided Access is on')).toBeTruthy();
    expect(screen.getByText(/triple-click/)).toBeTruthy();
    expect(screen.queryByText('Extra iOS lock')).toBeNull();
  });
});
