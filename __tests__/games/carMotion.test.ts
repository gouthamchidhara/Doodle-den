// T-052: cars follow the oval, speeds 80–160 px/s, race ends with every car parked at the start line.
import { carMotion, LAPS, raceSeconds } from '@/games/worlds/racetrack/carMotion';
import { trackGeom, trackPoint } from '@/games/worlds/racetrack/track';
import { spriteParams } from '@/games/worlds/spriteParams';
import { raceLength } from '@/screens/kid/RacetrackScreen';

const W = 1200;
const H = 800;

describe('racetrack', () => {
  it('track is a closed loop with a continuous path', () => {
    const g = trackGeom(W, H);
    const a = trackPoint(g, 0, 0);
    const b = trackPoint(g, g.length, 0);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
    for (let s = 0; s < g.length; s += 5) {
      const p = trackPoint(g, s, 0);
      const q = trackPoint(g, s + 5, 0);
      expect(Math.hypot(q.x - p.x, q.y - p.y)).toBeLessThan(5.5);
    }
  });

  it('every car finishes the 3-lap race and parks at the start line', () => {
    const ids = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
    const len = raceLength(ids, W, H);
    const g = trackGeom(W, H);
    ids.forEach((id, i) => {
      const p = spriteParams(id);
      expect(raceSeconds(p, W, H)).toBeLessThanOrEqual(len);
      const end = carMotion(len, p, i, ids.length, W, H, [0, len + 3]);
      const start = trackPoint(g, LAPS * g.length, 0);
      expect(Math.abs(end.x - start.x)).toBeLessThan(1);
    });
  });

  it('cars in different lanes do not overlap', () => {
    const p = spriteParams('same');
    const a = carMotion(2, p, 0, 4, W, H, [0, 999]);
    const b = carMotion(2, p, 3, 4, W, H, [0, 999]);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(10);
  });
});
