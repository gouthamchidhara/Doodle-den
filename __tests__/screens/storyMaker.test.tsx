// T-082: picks in tap order (max 4), nickname sent only when the parent allows it, story saved and opened.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { setDbForTesting } from '@/db/database';
import { saveArtwork } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { setMeta } from '@/db/repositories/metaRepo';
import { listStories } from '@/db/repositories/storyRepo';
import { StoryMakerScreen, toggleStoryPick } from '@/screens/kid/StoryMakerScreen';
import { makeStory } from '@/services/ai';
import { writeBase64 } from '@/services/files';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/services/ai', () => ({ ...jest.requireActual('@/services/ai'), makeStory: jest.fn() }));
jest.mock('@/games/paper/processPhoto', () => ({ pngAtLongEdge: (p: string) => p }));
jest.mock('@/components/kid/MagicWaiting', () => ({ MagicWaiting: () => null }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

async function setup(nick: boolean) {
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Zoe', avatarId: 'fox', ageMode: 'big' });
  useSessionStore.getState().setActiveKid(kid.id, 'big');
  await setMeta('ai_use_nickname', nick ? '1' : '0');
  writeBase64('a.png', 'AAA');
  await saveArtwork({ id: 'a', kidId: kid.id, activity: 'draw', title: null, pngPath: 'a.png', thumbPath: 't', strokesPath: null, durationSec: 1, createdAt: 1, updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null });
  jest.mocked(makeStory).mockResolvedValue({ ok: true, id: 's1', data: { title: 'Zoe and the Cat', pages: [{ artIndex: 0, text: 'A happy cat.' }] } });
  return kid.id;
}

describe('Story Maker', () => {
  it('orders picks by tap and caps at 4', () => {
    expect(toggleStoryPick(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleStoryPick(['a', 'b', 'c', 'd'], 'e')).toHaveLength(4);
    expect(toggleStoryPick(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('sends no nickname by default and saves the story', async () => {
    const kidId = await setup(false);
    await render(<StoryMakerScreen />);
    await fireEvent.press(await screen.findByLabelText('Pick this drawing'));
    await fireEvent.press(screen.getByLabelText('Make my story!'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith({ pathname: '/story/[storyId]', params: { storyId: 's1' } }));
    expect(jest.mocked(makeStory).mock.calls[0][0]).not.toHaveProperty('heroName');
    expect((await listStories(kidId))[0].title).toBe('Zoe and the Cat');
  });

  it('sends the nickname when the parent turned it on', async () => {
    jest.mocked(makeStory).mockClear();
    await setup(true);
    await render(<StoryMakerScreen />);
    await fireEvent.press(await screen.findByLabelText('Pick this drawing'));
    await fireEvent.press(screen.getByLabelText('Make my story!'));
    await waitFor(() => expect(makeStory).toHaveBeenCalled());
    expect(jest.mocked(makeStory).mock.calls[0][0].heroName).toBe('Zoe');
  });
});
