// Free Draw screen (T-025): Little mode tool limits, done sheet, hold-to-clear prompt. Skia canvas is mocked.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { DrawScreen } from '@/screens/kid/DrawScreen';
import { nextSize } from '@/screens/kid/draw/DrawPhoneLayout';
import { toolLimits } from '@/screens/kid/shared/useDrawingSession';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/canvas/DrawingCanvas', () => ({ DrawingCanvas: () => null }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

async function setup(ageMode: 'little' | 'big') {
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Ada', avatarId: 'fox', ageMode });
  useSessionStore.getState().setActiveKid(kid.id, ageMode);
  await render(<DrawScreen />);
}

describe('tool limits', () => {
  it('Little mode gets 5 tools and sizes M/L', () => {
    expect(toolLimits('little').tools).toEqual(['crayon', 'marker', 'glitter', 'stamp', 'eraser']);
    expect(toolLimits('little').sizes).toEqual(['M', 'L']);
    expect(toolLimits('big').tools).toHaveLength(7);
    expect(nextSize(['M', 'L'], 'L')).toBe('M');
  });
});

describe('DrawScreen', () => {
  it('Big mode shows every brush and the done sheet', async () => {
    await setup('big');
    for (const label of ['Crayon', 'Marker', 'Watercolor', 'Glitter', 'Neon', 'Stamps', 'Eraser']) expect(screen.getByLabelText(label)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("I'm done!"));
    await waitFor(() => expect(screen.getByText('Beautiful!')).toBeTruthy());
    expect(screen.getByText('New drawing')).toBeTruthy();
    expect(screen.getByText('My Gallery')).toBeTruthy();
  });

  it('Little mode hides watercolor, neon and the small size', async () => {
    await setup('little');
    expect(screen.queryByLabelText('Watercolor')).toBeNull();
    expect(screen.queryByLabelText('Neon')).toBeNull();
    expect(screen.queryByLabelText('Small brush')).toBeNull();
  });

  it('holding the trash asks "Start fresh?"', async () => {
    await setup('big');
    await fireEvent(screen.getByLabelText('Hold to start fresh'), 'longPress');
    expect(screen.getByText('Start fresh?')).toBeTruthy();
    await fireEvent.press(screen.getByText('No'));
    expect(screen.queryByText('Start fresh?')).toBeNull();
  });
});
