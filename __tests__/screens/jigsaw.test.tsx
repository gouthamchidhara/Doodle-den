// T-058: jigsaw flow — pick a drawing, Little mode offers 4/9 only, finishing saves the best time and the sticker.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Image } from 'react-native';

import { setDbForTesting } from '@/db/database';
import { saveArtwork } from '@/db/repositories/artworkRepo';
import { getResult } from '@/db/repositories/jigsawRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { listRewards } from '@/db/repositories/rewardRepo';
import { JigsawScreen, piecesFor } from '@/screens/kid/JigsawScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/games/jigsaw/JigsawBoard', () => {
  const RN = jest.requireActual<typeof import('react-native')>('react-native');
  return { JigsawBoard: ({ onDone }: { onDone: () => void }) => <RN.Pressable accessibilityLabel="solve" onPress={onDone} /> };
});
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('JigsawScreen', () => {
  it('runs a 4-piece puzzle', async () => {
    expect(piecesFor('little')).toEqual([4, 9]);
    expect(piecesFor('big')).toEqual([4, 9, 16, 24]);
    jest.spyOn(Image, 'getSize').mockImplementation((_u, ok) => ok?.(800, 600));
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Ji', avatarId: 'fox', ageMode: 'little' });
    useSessionStore.getState().setActiveKid(kid.id, 'little');
    await saveArtwork({ id: 'art', kidId: kid.id, activity: 'draw', title: null, pngPath: 'p.png', thumbPath: 't.png', strokesPath: null, durationSec: 1, createdAt: 1, updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null });
    await render(<JigsawScreen />);
    await fireEvent.press(await screen.findByLabelText('Use this drawing'));
    expect(screen.queryByLabelText('16 pieces')).toBeNull();
    await fireEvent.press(screen.getByLabelText('4 pieces'));
    await fireEvent(screen.getByTestId('jigsaw-area'), 'layout', { nativeEvent: { layout: { width: 800, height: 600 } } });
    await fireEvent.press(screen.getByLabelText('solve'));
    await waitFor(async () => expect(await getResult(kid.id, 'art', 4)).not.toBeNull());
    expect((await listRewards(kid.id)).map((r) => r.rewardId)).toContain('jigsaw_4');
  });
});
