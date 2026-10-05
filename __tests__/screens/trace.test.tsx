// T-042: Trace picker tabs and finishing a trace (board mocked; engine tested separately).
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { getProgress } from '@/db/repositories/progressRepo';
import { TraceScreen } from '@/screens/kid/TraceScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

jest.mock('@/games/trace/TraceBoard', () => {
  const RN = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    TraceBoard: ({ onDone }: { onDone: (s: 1 | 2 | 3) => void }) => (
      <RN.Pressable accessibilityLabel="finish trace" onPress={() => onDone(2)}>
        <RN.Text>board</RN.Text>
      </RN.Pressable>
    ),
  };
});
let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('TraceScreen', () => {
  it('Little mode shows uppercase only; finishing saves best stars and shows the word', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Al', avatarId: 'fox', ageMode: 'little' });
    useSessionStore.getState().setActiveKid(kid.id, 'little');
    await render(<TraceScreen />);
    expect(screen.getByLabelText('Trace A')).toBeTruthy();
    expect(screen.queryByLabelText('Trace a')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Numbers'));
    expect(screen.getByLabelText('Trace 7')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Letters'));
    await fireEvent.press(screen.getByLabelText('Trace A'));
    await fireEvent.press(screen.getByLabelText('finish trace'));
    expect(screen.getByText('A is for apple!')).toBeTruthy();
    await waitFor(async () => expect((await getProgress(kid.id)).find((p) => p.skill === 'trace_A')?.level).toBe(2));
  });
});
