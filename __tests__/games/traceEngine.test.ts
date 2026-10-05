// T-042: trace coverage, tolerance, stroke order and star math.
import { TRACE_PATHS, getTracePath, traceItems, traceWord } from '@/content/tracePaths';
import { addPoint, newTrace, prepareStrokes, project, starsFor, type XY } from '@/games/trace/traceEngine';

const line: XY[][] = [
  [
    [0, 0.5],
    [1, 0.5],
  ],
  [
    [0.5, 0],
    [0.5, 1],
  ],
];

describe('trace engine', () => {
  const strokes = prepareStrokes(line, 100, 100);

  it('progress follows the finger along the path', () => {
    let s = newTrace();
    for (let x = 0; x <= 50; x += 5) s = addPoint(s, strokes, x, 50, 18);
    expect(s.progress).toBeCloseTo(0.5, 1);
    expect(s.strokeIndex).toBe(0);
  });

  it('leaving tolerance pauses progress without failing', () => {
    let s = newTrace();
    for (let x = 0; x <= 30; x += 5) s = addPoint(s, strokes, x, 50, 18);
    const before = s.progress;
    s = addPoint(s, strokes, 40, 90, 18);
    expect(s.progress).toBe(before);
    expect(s.inside).toBe(s.total - 1);
  });

  it('cannot jump ahead to the end of a stroke', () => {
    let s = newTrace();
    s = addPoint(s, strokes, 0, 50, 18);
    s = addPoint(s, strokes, 100, 50, 18);
    expect(s.progress).toBeLessThan(0.5);
  });

  it('90% coverage completes a stroke and moves to the next, last one finishes', () => {
    let s = newTrace();
    for (let x = 0; x <= 92; x += 4) s = addPoint(s, strokes, x, 50, 18);
    expect(s.strokeIndex).toBe(1);
    expect(s.progress).toBe(0);
    for (let y = 0; y <= 92; y += 4) s = addPoint(s, strokes, 50, y, 18);
    expect(s.done).toBe(true);
  });

  it('projects onto the nearest segment', () => {
    expect(project(strokes[0], 25, 60).dist).toBeCloseTo(10);
    expect(project(strokes[0], 25, 60).fraction).toBeCloseTo(0.25);
  });

  it('stars: ≥90% = 3, ≥75% = 2, else 1', () => {
    expect(starsFor(9, 10)).toBe(3);
    expect(starsFor(8, 10)).toBe(2);
    expect(starsFor(1, 10)).toBe(1);
    expect(starsFor(0, 0)).toBe(3);
  });
});

describe('trace content', () => {
  it('has A–Z, a–z, 0–9 and 8 shapes with words', () => {
    expect(TRACE_PATHS).toHaveLength(26 + 26 + 10 + 8);
    expect(getTracePath('A')?.strokes).toHaveLength(3);
    expect(traceItems('letter', 'little')).toHaveLength(26);
    expect(traceItems('letter', 'big')).toHaveLength(52);
    expect(traceItems('shape', 'big').map((p) => p.id)).toEqual(['circle', 'square', 'triangle', 'star', 'heart', 'line', 'zigzag', 'spiral']);
    for (const p of TRACE_PATHS) expect(traceWord(p.id)).toBeTruthy();
    expect(traceWord('A')?.voice).toBe('letter_A');
  });

  it('A starts with the left slant from the top', () => {
    const a = getTracePath('A')?.strokes[0] ?? [];
    expect(a[0]).toEqual([0.5, 0.1]);
    expect(a[a.length - 1]).toEqual([0.2, 0.9]);
  });
});

describe('closed shapes', () => {
  it('a circle can be traced all the way round', () => {
    const circle = getTracePath('circle')?.strokes ?? [];
    const strokes = prepareStrokes(circle, 400, 400);
    let s = newTrace();
    for (const [x, y] of strokes[0].pts) s = addPoint(s, strokes, x + 3, y, 18);
    expect(s.done).toBe(true);
    expect(starsFor(s.inside, s.total)).toBe(3);
  });
});
