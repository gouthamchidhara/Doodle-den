// T-044: segment picker, no stamps, black/white toggle in Big mode, saves.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { KaleidoscopeScreen } from '@/screens/kid/KaleidoscopeScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/canvas/DrawingCanvas', () => ({ DrawingCanvas: () => null }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('KaleidoscopeScreen', () => {
  it('switches segments, hides stamps and shows the done sheet', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Ki', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    await render(<KaleidoscopeScreen />);
    expect(screen.queryByLabelText('Stamps')).toBeNull();
    expect(screen.getByLabelText('Background color')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Four parts'));
    await fireEvent.press(screen.getByLabelText("I'm done!"));
    await waitFor(() => expect(screen.getByText('New one')).toBeTruthy());
  });
});
