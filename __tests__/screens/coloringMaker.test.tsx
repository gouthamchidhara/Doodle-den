// T-080: WHO tile required; a generated page is saved and opened in the coloring screen; errors show the mascot line.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { makeColoringPage } from '@/services/ai';
import { ColoringMakerScreen } from '@/screens/kid/ColoringMakerScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/services/ai', () => ({
  ...jest.requireActual('@/services/ai'),
  makeColoringPage: jest.fn(),
}));
jest.mock('@/games/coloring/aiPagePost', () => ({ saveAiPage: async (_k: string, id: string) => `ai-${id}` }));
jest.mock('@/components/kid/MagicWaiting', () => ({ MagicWaiting: () => null }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('ColoringMakerScreen', () => {
  beforeEach(async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Ma', avatarId: 'fox', ageMode: 'little' });
    useSessionStore.getState().setActiveKid(kid.id, 'little');
  });

  it('makes a page from tiles and opens it', async () => {
    jest.mocked(makeColoringPage).mockResolvedValue({ ok: true, id: 'r1', data: { imageBase64: 'x', idea: 'cat flying' } });
    await render(<ColoringMakerScreen />);
    await fireEvent.press(screen.getByLabelText('cat'));
    await fireEvent.press(screen.getByLabelText('flying'));
    await fireEvent.press(screen.getByLabelText('Make my page!'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith({ pathname: '/coloring/[pageId]', params: { pageId: 'ai-r1' } }));
    expect(makeColoringPage).toHaveBeenCalledWith({ ageMode: 'little', tiles: { who: 'cat', doing: 'flying', where: undefined } });
  });

  it('shows the nap line when the cap is reached', async () => {
    jest.mocked(makeColoringPage).mockResolvedValue({ ok: false, code: 'CAP_REACHED' });
    await render(<ColoringMakerScreen />);
    await fireEvent.press(screen.getByLabelText('dog'));
    await fireEvent.press(screen.getByLabelText('Make my page!'));
    expect(await screen.findByText("My magic needs a nap. Let's try again tomorrow!")).toBeTruthy();
  });
});
