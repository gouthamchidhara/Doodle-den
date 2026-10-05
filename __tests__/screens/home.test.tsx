// Kid Home: shelves, Little/Big filtering, shelf persistence, daily idea (T-014).
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SHELVES, TILES, visibleTiles } from '@/content/activities';
import { pickDailyIdea } from '@/content/dailyIdea';
import voiceLines from '@/content/voiceLines.json';
import { setDbForTesting } from '@/db/database';
import { createKid } from '@/db/repositories/kidRepo';
import { getMeta } from '@/db/repositories/metaRepo';
import { HomeScreen } from '@/screens/kid/HomeScreen';
import { useSessionStore } from '@/state/sessionStore';

import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `kid-${++mockN}` }));

describe('activities catalog', () => {
  it('matches the A5 shelf table order', () => {
    expect(visibleTiles('draw', 'big', { arSupported: true }).map((t) => t.key)).toEqual(['draw', 'coloring', 'guided', 'kaleidoscope', 'flipbook', 'paper']);
    expect(visibleTiles('play', 'big', { arSupported: true }).map((t) => t.key)).toEqual(['aquarium', 'racetrack', 'zoo', 'ramps', 'music', 'jigsaw', 'arwall']);
    expect(visibleTiles('learn', 'big', { arSupported: false }).map((t) => t.key)).toEqual(['trace', 'mixing']);
    expect(visibleTiles('magic', 'big', { arSupported: false }).map((t) => t.key)).toEqual(['coloring_maker', 'magic_sketch', 'story_maker']);
    expect(visibleTiles('stuff', 'big', { arSupported: false }).map((t) => t.key)).toEqual(['gallery', 'stories', 'museum', 'stickers']);
  });
  it('Little mode hides Big-only tiles; no AR hides AR Wall', () => {
    expect(visibleTiles('draw', 'little', { arSupported: true }).map((t) => t.key)).toEqual(['draw', 'coloring', 'kaleidoscope', 'paper']);
    expect(visibleTiles('play', 'big', { arSupported: false }).map((t) => t.key)).not.toContain('arwall');
  });
  it('every tile and shelf has a voice line and labels are short', () => {
    const lines: Record<string, string> = voiceLines;
    for (const t of TILES) {
      expect(lines[`intro_${t.key}`]).toBeTruthy();
      expect(t.title.split(' ').length).toBeLessThanOrEqual(6);
    }
    for (const s of SHELVES) expect(lines[s.voice]).toBeTruthy();
  });
  it('daily idea rotates by day', () => {
    expect(pickDailyIdea('2026-10-05').id).not.toBe(pickDailyIdea('2026-10-06').id);
    expect(pickDailyIdea('2026-10-05')).toEqual(pickDailyIdea('2026-10-05'));
  });
});

describe('HomeScreen', () => {
  it('greets the kid, switches shelf and remembers it', async () => {
    setDbForTesting(await createTestDb());
    const kid = await createKid({ nickname: 'Mia', avatarId: 'fox', ageMode: 'big' });
    useSessionStore.getState().setActiveKid(kid.id, 'big');
    await render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText('Hi, Mia!')).toBeTruthy());
    expect(screen.getByLabelText('Free Draw')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Play'));
    expect(screen.getByLabelText('Aquarium')).toBeTruthy();
    await waitFor(async () => expect(await getMeta(`shelf_${kid.id}`)).toBe('play'));
  });
});
