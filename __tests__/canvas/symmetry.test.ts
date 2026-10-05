// T-044: kaleidoscope symmetry copies.
import { rotationAngles, symmetryPoints } from '@/canvas/symmetry';

const near = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

describe('symmetry', () => {
  it('2 mirrors left/right', () => {
    expect(symmetryPoints(10, 20, 2, 100, 100)).toEqual([
      [10, 20],
      [90, 20],
    ]);
  });

  it('4 rotates by 90° around the center', () => {
    const pts = symmetryPoints(50, 10, 4, 100, 100);
    expect(pts).toHaveLength(4);
    expect(near(pts[1], [90, 50])).toBe(true);
    expect(near(pts[2], [50, 90])).toBe(true);
    expect(near(pts[3], [10, 50])).toBe(true);
  });

  it('8 copies are equidistant from the center, 45° apart', () => {
    expect(rotationAngles(8)).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    for (const [x, y] of symmetryPoints(70, 30, 8, 100, 100)) expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(Math.hypot(20, 20));
  });

  it('1 is the identity', () => {
    expect(symmetryPoints(3, 4, 1, 10, 10)).toEqual([[3, 4]]);
    expect(rotationAngles(1)).toEqual([]);
  });
});
