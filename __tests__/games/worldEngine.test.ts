// T-050: trim rect, album split/bring-back, seeded params, titles.
import { emptyDoc } from '@/canvas/history';
import { trimRect } from '@/canvas/trimRect';
import { bringBack, splitOnScreen } from '@/games/worlds/album';
import { spriteParams } from '@/games/worlds/spriteParams';
import { WORLDS, worldFor, worldTitle } from '@/games/worlds/worldConfig';

const e = (id: string, createdAt: number) => ({ id, createdAt });

describe('world engine', () => {
  it('trims to the drawing plus padding, clamped to the image', () => {
    const doc = { ...emptyDoc(1), strokes: [{ id: 's', tool: 'marker' as const, color: 'tomato', size: 'S' as const, points: [{ x: 0.4, y: 0.4, p: 0.5, t: 0 }, { x: 0.6, y: 0.5, p: 0.5, t: 1 }] }] };
    const r = trimRect(doc, 900, 900);
    expect(r).not.toBeNull();
    expect(r?.x).toBeLessThan(360 - 8);
    expect((r?.x ?? 0) + (r?.width ?? 0)).toBeGreaterThan(540 + 8);
    expect(trimRect(emptyDoc(1), 900, 900)).toBeNull();
    const edge = { ...doc, strokes: [{ ...doc.strokes[0], points: [{ x: 0, y: 0, p: 0.5, t: 0 }] }] };
    expect(trimRect(edge, 900, 900)?.x).toBe(0);
  });

  it('keeps the newest on screen and swaps out the oldest when bringing one back', () => {
    const all = [e('a', 1), e('b', 2), e('c', 3), e('d', 4)];
    const { onScreen, album } = splitOnScreen(all, 3, null);
    expect(onScreen.map((x) => x.id)).toEqual(['d', 'c', 'b']);
    expect(album.map((x) => x.id)).toEqual(['a']);
    const ids = bringBack(onScreen, 'a', 3);
    expect(ids).toEqual(['a', 'd', 'c']);
    expect(splitOnScreen(all, 3, ids).album.map((x) => x.id)).toEqual(['b']);
    expect(splitOnScreen([...all, e('new', 9)], 3, ids).onScreen.map((x) => x.id)).toContain('new');
  });

  it('seeded params are stable per id', () => {
    expect(spriteParams('fish-1')).toEqual(spriteParams('fish-1'));
    expect(spriteParams('fish-1')).not.toEqual(spriteParams('fish-2'));
  });

  it('titles and config', () => {
    expect(worldTitle(WORLDS.aquarium, 'Mia', 6)).toBe("Mia's Aquarium · 6 fish");
    expect(worldTitle(WORLDS.racetrack, 'Mia', 1)).toBe("Mia's Racetrack · 1 car");
    expect(worldFor('zoo').max).toBe(16);
    expect(worldFor(undefined).key).toBe('aquarium');
  });
});
