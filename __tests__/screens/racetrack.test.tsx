// T-052: a fresh Racetrack profile can race a local sample car without creating child artwork.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useFocusEffect } from 'expo-router';
import { useEffect } from 'react';

import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { listEntities } from '@/db/repositories/worldRepo';
import { RacetrackScreen } from '@/screens/kid/RacetrackScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

describe('RacetrackScreen', () => {
  it('lets a new profile start a race without saving the sample car as child artwork', async () => {
    jest.mocked(useFocusEffect).mockImplementation((callback) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => callback(), [callback]);
    });
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'little' });
    useSessionStore.getState().setActiveKid(kid.id, 'little');

    const view = await render(<RacetrackScreen />);
    await fireEvent(screen.getByTestId('world-scene'), 'layout', { nativeEvent: { layout: { width: 800, height: 500 } } });
    expect(await screen.findByLabelText('Sample car')).toBeTruthy();
    const go = await screen.findByLabelText('Go!');
    expect(go.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(go);
    await waitFor(() => expect(screen.getByLabelText('Go!').props.accessibilityState.disabled).toBe(true));
    expect(await listEntities(kid.id, 'racetrack')).toEqual([]);
    view.unmount();
  });
});
