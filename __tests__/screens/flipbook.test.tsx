// T-046: Flipbook Studio — add frames, delete with confirm (not below 3), speeds, done saves one flipbook.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setDbForTesting } from '@/db/database';
import { listFlipbooks } from '@/db/repositories/flipbookRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { FlipbookScreen } from '@/screens/kid/FlipbookScreen';
import { useSessionStore } from '@/state/sessionStore';
import type { StrokeDoc } from '@/types/models';

import { createTestDb } from '../helpers/nodeDb';

const mockCanvas: { onChange?: (d: StrokeDoc) => void; doc?: StrokeDoc } = {};
jest.mock('@/canvas/DrawingCanvas', () => ({
  DrawingCanvas: (p: { onChange: (d: StrokeDoc) => void; doc: StrokeDoc }) => {
    mockCanvas.onChange = p.onChange;
    mockCanvas.doc = p.doc;
    return null;
  },
}));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png', renderDocImage: () => null }));
jest.mock('@/screens/kid/flipbook/FrameThumb', () => ({ FrameThumb: () => null }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('FlipbookScreen', () => {
  it('manages frames and saves one flipbook', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Fe', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    await render(<FlipbookScreen />);
    expect(screen.getByLabelText('Frame 3')).toBeTruthy();
    await fireEvent(screen.getByLabelText('Frame 1'), 'longPress');
    expect(screen.queryByText('Delete this page?')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Add frame'));
    expect(screen.getByLabelText('Frame 4')).toBeTruthy();
    await fireEvent(screen.getByLabelText('Frame 4'), 'longPress');
    await fireEvent.press(screen.getByText('Yes'));
    expect(screen.queryByLabelText('Frame 4')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Fast'));
    const doc = mockCanvas.doc as StrokeDoc;
    await act(async () => {
      mockCanvas.onChange?.({ ...doc, strokes: [{ id: 's', tool: 'crayon', color: 'tomato', size: 'M', points: [{ x: 0.2, y: 0.2, p: 0.5, t: 0 }] }] });
    });
    await fireEvent.press(screen.getByLabelText("I'm done!"));
    await waitFor(() => expect(screen.getByText('Watch it')).toBeTruthy());
    const books = await listFlipbooks(kid.id);
    expect(books).toHaveLength(1);
    expect(books[0].fps).toBe(8);
    expect(books[0].frameIds).toHaveLength(3);
  });
});
