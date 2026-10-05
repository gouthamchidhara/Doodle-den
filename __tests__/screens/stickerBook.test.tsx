// T-048: Sticker Book pages, gray silhouettes for unearned, decorate + save; toast shows an earned sticker.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RewardToast } from '@/components/kid/RewardToast';
import { setDbForTesting } from '@/db/database';
import { countArtworks } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { grantReward } from '@/db/repositories/rewardRepo';
import { bookSlots, StickerBookScreen } from '@/screens/kid/StickerBookScreen';
import { useRewardStore } from '@/state/rewardStore';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/games/rewards/renderDecorate', () => ({ renderDecoratePng: () => 'png' }));
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('StickerBookScreen', () => {
  it('shows earned stickers in color and lets the kid decorate a page', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'St', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    await grantReward(kid.id, 'first_drawing');
    await grantReward(kid.id, 'day_2026-10-05');
    expect(bookSlots(['day_2026-10-05']).slice(-1)).toEqual(['day_2026-10-05']);
    await render(<StickerBookScreen />);
    expect(await screen.findByLabelText('First drawing!')).toBeTruthy();
    expect(screen.getAllByLabelText('Sticker to find').length).toBeGreaterThan(5);
    await fireEvent.press(screen.getByLabelText('Decorate'));
    await fireEvent.press(screen.getByLabelText('Add first_drawing'));
    await fireEvent.press(screen.getByLabelText('Save my page'));
    await waitFor(async () => expect(await countArtworks(kid.id)).toBe(1));
  });
});

describe('RewardToast', () => {
  it('shows the next queued sticker', async () => {
    jest.useFakeTimers();
    useRewardStore.setState({ queue: ['first_color'], lastShownAt: null });
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 800, height: 600 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <RewardToast />
      </SafeAreaProvider>,
    );
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(screen.getByText('My first color')).toBeTruthy();
    jest.useRealTimers();
  });
});
