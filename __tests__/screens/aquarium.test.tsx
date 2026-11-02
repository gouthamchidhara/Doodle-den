// T-051: aquarium shows the kid's fish with the title, feed works, and "Draw a new fish" opens world-draw.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useFocusEffect } from 'expo-router';
import { useEffect } from 'react';

import { setDbForTesting } from '@/db/database';
import { saveArtwork } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { saveEntity } from '@/db/repositories/worldRepo';
import { AquariumScreen } from '@/screens/kid/AquariumScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('AquariumScreen', () => {
  it('lists fish, feeds and draws a new fish', async () => {
    jest.mocked(useFocusEffect).mockImplementation((cb) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => cb(), [cb]);
    });
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    for (const id of ['f1', 'f2']) {
      await saveArtwork({ id, kidId: kid.id, activity: 'world', title: null, pngPath: `art/${id}.png`, thumbPath: `art/${id}.t.png`, strokesPath: null, durationSec: 0, createdAt: 1, updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null });
      await saveEntity({ id: `e-${id}`, kidId: kid.id, world: 'aquarium', artworkId: id, name: id === 'f1' ? 'Sunny' : 'Pip', voiceClipId: null, createdAt: 1 });
    }
    await render(<AquariumScreen />);
    expect(await screen.findByText("Mia's Aquarium · 2 fish")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Feed the fish'));
    await fireEvent.press(screen.getByLabelText('Draw a new fish'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/world-draw', params: { world: 'aquarium' } });
  });
});
