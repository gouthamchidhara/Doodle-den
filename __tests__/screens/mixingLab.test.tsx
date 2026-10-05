// T-043: mixing red + white makes a new color; naming saves it and it appears in Free Draw.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { setDbForTesting } from '@/db/database';
import { listCustomColors } from '@/db/repositories/colorRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { DrawScreen } from '@/screens/kid/DrawScreen';
import { MixingLabScreen } from '@/screens/kid/MixingLabScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/canvas/DrawingCanvas', () => ({ DrawingCanvas: () => null }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

const tapPot = async (label: string) => {
  await act(async () => {
    fireGestureHandler(getByGestureTestId(`pot-${label}`), [{ state: State.BEGAN }, { state: State.ACTIVE }, { state: State.END }]);
  });
};

describe('MixingLabScreen', () => {
  it('discovers, names and saves a new color', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Mo', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    const view = await render(<MixingLabScreen />);
    await tapPot('Red');
    await tapPot('White');
    expect(await screen.findByText('You made a new color!')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('dragon'));
    await fireEvent.press(screen.getByLabelText('goo'));
    expect(screen.getByText('Dragon Goo')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Save my color'));
    await waitFor(async () => expect((await listCustomColors(kid.id)).map((c) => c.name)).toEqual(['Dragon Goo']));
    view.unmount();

    await render(<DrawScreen />);
    expect(await screen.findByLabelText('Dragon Goo')).toBeTruthy();
  });
});
