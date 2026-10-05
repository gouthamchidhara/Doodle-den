// T-040/T-041: coloring picker, tap-fill in Little mode, bucket/brush switch in Big mode, save on done.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { COLORING_PAGES, pagesFor } from '@/content/coloringPages';
import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { ColoringPickerScreen } from '@/screens/kid/ColoringPickerScreen';
import { ColoringScreen } from '@/screens/kid/ColoringScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

const mockFillAt = jest.fn(() => true);
jest.mock('@/games/coloring/useColoringPage', () => ({
  useColoringPage: () => ({
    lineArt: null,
    fillImage: null,
    ready: true,
    version: 0,
    fillAt: mockFillAt,
    undoFill: jest.fn(() => true),
    hasFills: () => true,
    writeFill: jest.fn(async () => []),
  }),
}));
jest.mock('@/canvas/DrawingCanvas', () => ({ DrawingCanvas: () => null }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

async function setup(ageMode: 'little' | 'big') {
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Bo', avatarId: 'fox', ageMode });
  useSessionStore.getState().setActiveKid(kid.id, ageMode);
}

describe('coloring content', () => {
  it('has the 3 placeholder pages in categories', () => {
    expect(COLORING_PAGES.map((p) => p.id)).toEqual(['cat', 'car', 'fish']);
    expect(pagesFor('animals', 'little').map((p) => p.id)).toEqual(['cat']);
  });
});

describe('ColoringPickerScreen', () => {
  it('lists category rows and opens a page', async () => {
    await setup('big');
    await render(<ColoringPickerScreen />);
    expect(screen.getByText('Animals')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Car'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/coloring/[pageId]', params: { pageId: 'car' } });
  });
});

describe('ColoringScreen', () => {
  beforeEach(() => jest.mocked(useLocalSearchParams).mockReturnValue({ pageId: 'cat' }));

  it('Little mode: tap fills at the tapped spot; no brush tools', async () => {
    await setup('little');
    await render(<ColoringScreen />);
    await fireEvent(screen.getByTestId('coloring-area'), 'layout', { nativeEvent: { layout: { width: 500, height: 400 } } });
    await fireEvent.press(screen.getByLabelText('Coloring page'), { nativeEvent: { locationX: 200, locationY: 100 } });
    expect(mockFillAt).toHaveBeenCalledWith(0.5, 0.25, expect.stringMatching(/^#/));
    expect(screen.queryByLabelText('Fill bucket')).toBeNull();
  });

  it('Big mode: picking a brush turns the bucket off; done shows the sheet', async () => {
    await setup('big');
    await render(<ColoringScreen />);
    expect(screen.getByLabelText('Coloring page')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Marker'));
    expect(screen.queryByLabelText('Coloring page')).toBeNull();
    await fireEvent.press(screen.getByLabelText("I'm done!"));
    await waitFor(() => expect(screen.getByText('More pages')).toBeTruthy());
  });
});
