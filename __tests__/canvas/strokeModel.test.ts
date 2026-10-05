// Stroke model unit tests (T-020).
import {
  docBounds, hashString, normalizePoint, polylineLength, pressureWidth, rainbowHue, samplesAlong, seededRandom,
  shouldKeepPoint, smoothPath, strokeBounds, thinPoints, denormalize,
} from '@/canvas/strokeModel';

describe('strokeModel', () => {
  it('normalizes and denormalizes', () => {
    expect(normalizePoint(50, 25, 100, 50, 0.7, 12.4)).toEqual({ x: 0.5, y: 0.5, p: 0.7, t: 12 });
    expect(normalizePoint(10, 10, 0, 0, 2, -5)).toEqual({ x: 0, y: 0, p: 1, t: 0 });
    expect(denormalize({ x: 0.5, y: 0.25 }, 200, 100)).toEqual({ x: 100, y: 25 });
  });
  it('thins points closer than 2 px', () => {
    const pts = [0, 0.5, 1, 3, 3.5, 6].map((x, i) => ({ x: x / 100, y: 0, p: 0.5, t: i }));
    expect(thinPoints(pts, 100, 100).map((p) => Math.round(p.x * 100 * 10) / 10)).toEqual([0, 3, 6]);
    expect(shouldKeepPoint(undefined, pts[0], 100, 100)).toBe(true);
  });
  it('pressure width multiplier', () => {
    expect(pressureWidth(0.5)).toBeCloseTo(1.0);
    expect(pressureWidth(0)).toBeCloseTo(0.6);
    expect(pressureWidth(1)).toBeCloseTo(1.4);
  });
  it('smooths through midpoints with quadratics', () => {
    expect(smoothPath([])).toEqual([]);
    expect(smoothPath([{ x: 1, y: 1 }])).toEqual([{ c: 'M', x: 1, y: 1 }]);
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toEqual([{ c: 'M', x: 0, y: 0 }, { c: 'L', x: 10, y: 0 }]);
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 10 }])).toEqual([
      { c: 'M', x: 0, y: 0 },
      { c: 'Q', cx: 10, cy: 0, x: 15, y: 5 },
      { c: 'L', x: 20, y: 10 },
    ]);
  });
  it('bounds', () => {
    expect(strokeBounds([])).toBeNull();
    expect(strokeBounds([{ x: 0.2, y: 0.5 }, { x: 0.6, y: 0.1 }])).toEqual({ minX: 0.2, minY: 0.1, maxX: 0.6, maxY: 0.5 });
    expect(docBounds([{ points: [{ x: 0.1, y: 0.1 }] }, { points: [{ x: 0.9, y: 0.8 }] }])).toEqual({ minX: 0.1, minY: 0.1, maxX: 0.9, maxY: 0.8 });
  });
  it('seeded random is deterministic per seed', () => {
    const a = seededRandom('stroke-1');
    const b = seededRandom('stroke-1');
    const c = seededRandom('stroke-2');
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect(c()).not.toBe(seqA[0]);
    for (const v of seqA) expect(v >= 0 && v < 1).toBe(true);
    expect(hashString('abc')).toBe(hashString('abc'));
  });
  it('samples along a path and computes rainbow hue', () => {
    const line = [{ x: 0, y: 0 }, { x: 30, y: 0 }];
    expect(polylineLength(line)).toBe(30);
    expect(samplesAlong(line, 14).map((s) => s.x)).toEqual([0, 14, 28]);
    expect(rainbowHue(0, 30)).toBe(30);
    expect(rainbowHue(400, 0)).toBe(0);
    expect(rainbowHue(200, 90)).toBe(270);
  });
});
