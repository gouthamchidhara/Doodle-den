// T-060: picking rules, show timeline (~45 s), opening saves an exhibit and grants the museum sticker.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setDbForTesting } from '@/db/database';
import { saveArtwork, toggleFavorite } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { listExhibits } from '@/db/repositories/museumRepo';
import { listRewards } from '@/db/repositories/rewardRepo';
import { showLength, showStep, surprise, togglePick } from '@/games/museum/museumPlan';
import { MuseumScreen } from '@/screens/kid/MuseumScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/games/museum/MuseumShow', () => ({ MuseumShow: () => null }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('museum plan', () => {
  it('picks, surprises and times the show', () => {
    expect(togglePick(['a', 'b', 'c', 'd', 'e', 'f'], 'g')).toHaveLength(6);
    expect(togglePick(['a'], 'a')).toEqual([]);
    const arts = [{ id: 'old', isFavorite: false, createdAt: 1 }, { id: 'fav', isFavorite: true, createdAt: 0 }, { id: 'new', isFavorite: false, createdAt: 5 }];
    expect(surprise(arts)).toEqual(['fav', 'new', 'old']);
    expect(showLength(6)).toBeGreaterThanOrEqual(40000);
    expect(showLength(6)).toBeLessThanOrEqual(50000);
    expect(showStep(0, 3)).toEqual({ kind: 'spot', index: 0 });
    expect(showStep(15100, 3).kind).toBe('parade');
    expect(showStep(showLength(3), 3).kind).toBe('end');
  });
});

describe('MuseumScreen', () => {
  it('Surprise me opens the museum, saves the exhibit and the sticker', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Mu', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    for (const id of ['a', 'b', 'c', 'd']) await saveArtwork({ id, kidId: kid.id, activity: 'draw', title: null, pngPath: `${id}.png`, thumbPath: `${id}.t.png`, strokesPath: null, durationSec: 1, createdAt: id.charCodeAt(0), updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null });
    await toggleFavorite('a');
    await render(<MuseumScreen />);
    await screen.findAllByLabelText('Pick this drawing');
    await fireEvent.press(screen.getByLabelText('Surprise me'));
    await waitFor(async () => expect(await listExhibits(kid.id)).toHaveLength(1));
    expect((await listExhibits(kid.id))[0].artworkIds[0]).toBe('a');
    expect((await listRewards(kid.id)).map((r) => r.rewardId)).toContain('museum_night');
  });
});
