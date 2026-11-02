// T-056: Draw / Play toggle; play shows Reset balls; a landing grants the bucket sticker.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { listRewards } from '@/db/repositories/rewardRepo';
import { RampsScreen } from '@/screens/kid/RampsScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/canvas/DrawingCanvas', () => ({ DrawingCanvas: () => null }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('@/games/ramps/RampsPlay', () => {
  const RN = jest.requireActual<typeof import('react-native')>('react-native');
  return { RampsPlay: ({ onLanded }: { onLanded: () => void }) => <RN.Pressable accessibilityLabel="land" onPress={onLanded} /> };
});
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('RampsScreen', () => {
  it('switches to play and celebrates a ball in the bucket', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Ra', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    await render(<RampsScreen />);
    await fireEvent(screen.getByTestId('ramps-area'), 'layout', { nativeEvent: { layout: { width: 800, height: 500 } } });
    await fireEvent.press(screen.getByLabelText('Play'));
    expect(screen.getByLabelText('Reset balls')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('land'));
    await waitFor(async () => expect((await listRewards(kid.id)).map((r) => r.rewardId)).toContain('bucket_one'));
  });
});
