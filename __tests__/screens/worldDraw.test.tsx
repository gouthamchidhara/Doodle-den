// T-050: creature flow — Send it! after 3 strokes, name, entity saved, world opens with the entrance.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { setDbForTesting } from '@/db/database';
import { getArtwork } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { listRewards } from '@/db/repositories/rewardRepo';
import { listEntities } from '@/db/repositories/worldRepo';
import { WorldDrawScreen } from '@/screens/kid/WorldDrawScreen';
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
jest.mock('@/canvas/exportTrimmed', () => ({ exportTrimmedPng: () => 'png' }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

const stroke = (id: string) => ({ id, tool: 'crayon' as const, color: 'sky', size: 'M' as const, points: [{ x: 0.3, y: 0.3, p: 0.5, t: 0 }] });

describe('WorldDrawScreen', () => {
  it('saves a named fish into the aquarium', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Wo', avatarId: 'fox', ageMode: 'little' });
    useSessionStore.getState().setActiveKid(kid.id, 'little');
    jest.mocked(useLocalSearchParams).mockReturnValue({ world: 'aquarium' });
    await render(<WorldDrawScreen />);
    await fireEvent(screen.getByTestId('world-canvas-area'), 'layout', { nativeEvent: { layout: { width: 500, height: 500 } } });
    for (const id of ['a', 'b', 'c']) {
      await act(async () => {
        const d = mockCanvas.doc as StrokeDoc;
        mockCanvas.onChange?.({ ...d, strokes: [...d.strokes, stroke(id)] });
      });
    }
    await fireEvent.press(screen.getByLabelText('Send it!'));
    await fireEvent.press(await screen.findByLabelText('Go!'));
    await waitFor(async () => expect(await listEntities(kid.id, 'aquarium')).toHaveLength(1));
    const [e] = await listEntities(kid.id, 'aquarium');
    expect(e.name).toBeTruthy();
    expect((await getArtwork(e.artworkId))?.activity).toBe('world');
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/aquarium', params: { enter: e.id } });
    expect((await listRewards(kid.id)).map((r) => r.rewardId)).toContain('first_fish');
  });
});
