// T-058: grids for 4/9/16/24, neighbours always fit, seeded edges, 24 px snap.
import { gridFor, makeEdges, pieceSides, piecePath, scatter, shouldSnap } from '@/games/jigsaw/pieces';

describe('jigsaw pieces', () => {
  it('grids', () => {
    expect(gridFor(4, true)).toEqual({ rows: 2, cols: 2 });
    expect(gridFor(9, true)).toEqual({ rows: 3, cols: 3 });
    expect(gridFor(16, false)).toEqual({ rows: 4, cols: 4 });
    expect(gridFor(24, true)).toEqual({ rows: 4, cols: 6 });
    expect(gridFor(24, false)).toEqual({ rows: 6, cols: 4 });
  });

  it('every internal edge is a tab on one side and a blank on the other; borders are flat', () => {
    const { rows, cols } = gridFor(24, true);
    const e = makeEdges('art-1-24', rows, cols);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const s = pieceSides(e, r, c, rows, cols);
        if (c < cols - 1) expect(s.right).toBe(-pieceSides(e, r, c + 1, rows, cols).left);
        if (r < rows - 1) expect(s.bottom).toBe(-pieceSides(e, r + 1, c, rows, cols).top);
        if (r === 0) expect(s.top).toBe(0);
        if (c === 0) expect(s.left).toBe(0);
      }
    }
  });

  it('is seeded: same drawing + count = same cuts', () => {
    expect(makeEdges('a-9', 3, 3)).toEqual(makeEdges('a-9', 3, 3));
    expect(JSON.stringify(makeEdges('a-9', 3, 3))).not.toBe(JSON.stringify(makeEdges('b-9', 3, 3)));
  });

  it('paths and snapping', () => {
    expect(piecePath(100, 100, 25, { top: 0, right: 1, bottom: -1, left: 0 })).toMatch(/^M25 25.*Z$/);
    expect(shouldSnap(110, 110, 100, 100)).toBe(true);
    expect(shouldSnap(120, 120, 100, 100)).toBe(false);
    const spots = scatter('s', 9, { x: 0, y: 0, w: 500, h: 200 }, 100, 100);
    expect(spots).toHaveLength(9);
    for (const p of spots) expect(p.x).toBeLessThanOrEqual(400);
  });
});
