// T-034: wind-down banner, finish-drawing button and break bubble react to lock events.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isDrawingRoute, WindDownOverlay } from '@/components/kid/WindDownOverlay';
import { lockController } from '@/lock/lockRuntime';
import { useLockStore } from '@/lock/lockStore';
import { useSessionStore } from '@/state/sessionStore';

jest.mock('@/lock/lockRuntime', () => ({ lockController: { finishDrawing: jest.fn(async () => true) } }));

const push = async (ev: Parameters<ReturnType<typeof useLockStore.getState>['pushEvents']>[0]) => {
  await act(async () => {
    useLockStore.getState().pushEvents(ev);
  });
};

const metrics = { frame: { x: 0, y: 0, width: 1194, height: 834 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

beforeEach(() => {
  jest.mocked(useSegments).mockReturnValue(['(kid)', 'draw'] as never);
  useLockStore.getState().reset();
  useSessionStore.getState().setActiveKid('k', 'big');
});

describe('WindDownOverlay', () => {
  it('WARN_1 shows the banner with "Finish my drawing" on drawing screens', async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <WindDownOverlay />
      </SafeAreaProvider>,
    );
    await push(['WARN_1']);
    expect(screen.getByText('Getting sleepy… finish your drawing soon!')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Finish my drawing'));
    expect(lockController.finishDrawing).toHaveBeenCalled();
    expect(await screen.findByText('OK! 2 more minutes.')).toBeTruthy();
    expect(screen.queryByLabelText('Finish my drawing')).toBeNull();
  });

  it('BREAK shows the stretch bubble; no finish button off drawing screens', async () => {
    jest.mocked(useSegments).mockReturnValue(['(kid)', 'home'] as never);
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <WindDownOverlay />
      </SafeAreaProvider>,
    );
    await push(['BREAK', 'WARN_1']);
    expect(screen.getByText('Stretch break! Wiggle your arms!')).toBeTruthy();
    expect(screen.queryByLabelText('Finish my drawing')).toBeNull();
  });

  it('knows drawing routes', () => {
    expect(isDrawingRoute(['(kid)', 'coloring', '[pageId]'])).toBe(true);
    expect(isDrawingRoute(['(kid)', 'gallery'])).toBe(false);
  });
});
