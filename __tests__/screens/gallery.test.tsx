// T-047: gallery grid opens details; favorite and hold-to-trash work; later-feature buttons stay hidden.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { setDbForTesting } from '@/db/database';
import { getArtwork, saveArtwork } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { GalleryDetailScreen } from '@/screens/kid/GalleryDetailScreen';
import { GalleryScreen } from '@/screens/kid/GalleryScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/components/kid/ReplayCanvas', () => ({ ReplayCanvas: () => null }));
jest.mock('@/screens/kid/flipbook/FrameThumb', () => ({ FrameThumb: () => null }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

async function seed() {
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Ga', avatarId: 'fox', ageMode: 'big' });
  useSessionStore.getState().setActiveKid(kid.id, 'big');
  await saveArtwork({
    id: 'art-1',
    kidId: kid.id,
    activity: 'draw',
    title: null,
    pngPath: 'art/x/art-1.png',
    thumbPath: 'art/x/art-1.thumb.png',
    strokesPath: null,
    durationSec: 3,
    createdAt: 1,
    updatedAt: 1,
    isFavorite: false,
    isSticker: false,
    trashedAt: null,
  });
}

describe('Gallery', () => {
  beforeEach(() => {
    jest.mocked(useFocusEffect).mockImplementation((cb) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => cb(), [cb]);
    });
  });

  it('grid shows drawings and opens the detail', async () => {
    await seed();
    await render(<GalleryScreen />);
    await fireEvent.press(await screen.findByLabelText('My drawing'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/gallery/[artworkId]', params: { artworkId: 'art-1' } });
  });

  it('detail: favorite, keep drawing, hold to trash; future buttons hidden', async () => {
    await seed();
    jest.mocked(useLocalSearchParams).mockReturnValue({ artworkId: 'art-1' });
    await render(<GalleryDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Favorite'));
    await waitFor(async () => expect((await getArtwork('art-1'))?.isFavorite).toBe(true));
    expect(screen.queryByLabelText('Replay')).toBeNull();
    expect(screen.queryByLabelText('Make a sticker')).toBeNull();
    expect(screen.queryByLabelText('Magic')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Keep drawing'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/draw', params: { artworkId: 'art-1' } });
    await fireEvent(screen.getByLabelText('Hold to trash'), 'longPress');
    await waitFor(async () => expect((await getArtwork('art-1'))?.trashedAt).not.toBeNull());
    expect(router.back).toHaveBeenCalled();
  });
});
