// T-054: camera permission goes through the Parent Gate; a capture becomes a world creature.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { listRewards } from '@/db/repositories/rewardRepo';
import { listEntities } from '@/db/repositories/worldRepo';
import { PaperScreen } from '@/screens/kid/PaperScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useCameraPermissions: jest.fn(),
    CameraView: React.forwardRef(function Cam(_p: object, ref: React.Ref<{ takePictureAsync: () => Promise<object> }>) {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: async () => ({ uri: 'file:///tmp/p.jpg', width: 4000, height: 3000 }) }));
      return null;
    }),
  };
});
jest.mock('@/games/paper/processPhoto', () => ({
  processPhoto: async () => ({ ok: true, png: 'cG5n', width: 300, height: 200 }),
  pngAtLongEdge: (png: string) => png,
}));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

async function setup() {
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Pa', avatarId: 'fox', ageMode: 'big' });
  useSessionStore.getState().setActiveKid(kid.id, 'big');
  return kid.id;
}

describe('PaperScreen', () => {
  it('asks a grown-up for the camera first', async () => {
    await setup();
    jest.mocked(useCameraPermissions).mockReturnValue([{ granted: false } as never, jest.fn(), jest.fn()]);
    await render(<PaperScreen />);
    expect(screen.getByText('Ask a grown-up to let me use the camera.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Grown-ups'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/parent/gate', params: { next: '/paper?granted=1' } });
  });

  it('turns a photo into an aquarium fish', async () => {
    const kidId = await setup();
    jest.mocked(useCameraPermissions).mockReturnValue([{ granted: true } as never, jest.fn(), jest.fn()]);
    await render(<PaperScreen />);
    await fireEvent.press(screen.getByLabelText('Take the picture'));
    await fireEvent.press(await screen.findByText('Aquarium'));
    await waitFor(async () => expect(await listEntities(kidId, 'aquarium')).toHaveLength(1));
    expect((await listRewards(kidId)).map((r) => r.rewardId)).toContain('first_paper');
  });
});
