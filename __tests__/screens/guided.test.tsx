// T-045: lessons, step voice, Next through to "Now color it!", finishing saves progress.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { GUIDED_LESSONS } from '@/content/guidedLessons';
import voiceLines from '@/content/voiceLines.json';
import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { getProgress } from '@/db/repositories/progressRepo';
import { GuidedScreen } from '@/screens/kid/GuidedScreen';
import { say } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/canvas/DrawingCanvas', () => ({ DrawingCanvas: () => null }));
jest.mock('@/canvas/exportPng', () => ({ exportPngBase64: () => 'png' }));
jest.mock('@/games/guided/handPoints', () => ({ handPoints: () => [] }));
jest.mock('@/services/voice', () => ({ say: jest.fn(), sayText: jest.fn(), stopVoice: jest.fn(), voiceText: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('guided lessons content', () => {
  it('has cat, house, fish; every step has a voice line; last step is "Now color it!"', () => {
    const lines: Record<string, string> = voiceLines;
    expect(GUIDED_LESSONS.map((l) => l.id)).toEqual(['cat', 'house', 'fish']);
    for (const l of GUIDED_LESSONS) {
      for (const s of l.steps) expect(lines[s.voice]).toBeTruthy();
      expect(l.steps[l.steps.length - 1].text).toBe('Now color it!');
    }
  });
});

describe('GuidedScreen', () => {
  it('walks through a lesson and records progress', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Gi', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    await render(<GuidedScreen />);
    await fireEvent.press(screen.getByLabelText('House'));
    expect(screen.getByText('Draw a big square.')).toBeTruthy();
    expect(say).toHaveBeenCalledWith('guided_house_1');
    for (let i = 0; i < 5; i += 1) await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('Now color it!')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("I'm done!"));
    await waitFor(() => expect(screen.getByText('More lessons')).toBeTruthy());
    expect((await getProgress(kid.id)).map((p) => p.skill)).toContain('guided_house');
  });
});
