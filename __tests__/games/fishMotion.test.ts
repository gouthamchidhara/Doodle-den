// T-051: fish stay inside the tank, flip at the edges, bob 10–30 px, feeding steers the chosen fish.
import { feedWeight, fishMotion, nearestFish, swimPose } from '@/games/worlds/aquarium/fishMotion';
import { spriteParams } from '@/games/worlds/spriteParams';

const W = 1000;
const H = 700;

describe('fish motion', () => {
  it('stays in the water and flips direction at the edges', () => {
    const p = { ...spriteParams('fish-a'), dir: 1 as const, start: 0, speed: 1 };
    const flips = new Set<boolean>();
    for (let t = 0; t < 60; t += 0.5) {
      const pose = swimPose(t, p, W, H);
      expect(pose.x).toBeGreaterThanOrEqual(W * 0.08 - 1e-6);
      expect(pose.x).toBeLessThanOrEqual(W * 0.92 + 1e-6);
      expect(pose.y).toBeGreaterThan(H * 0.2);
      expect(pose.y).toBeLessThan(H * 0.75);
      flips.add(pose.flip);
    }
    expect(flips.size).toBe(2);
  });

  it('speed is 20–60 px/s', () => {
    const slow = { ...spriteParams('x'), speed: 0, start: 0.1, dir: 1 as const };
    expect(swimPose(1, slow, W, H).x - swimPose(0, slow, W, H).x).toBeCloseTo(20, 0);
    const fast = { ...slow, speed: 1 };
    expect(swimPose(1, fast, W, H).x - swimPose(0, fast, W, H).x).toBeCloseTo(60, 0);
  });

  it('feeding pulls the 3 nearest fish toward the food, then lets go', () => {
    const params = ['a', 'b', 'c', 'd', 'e'].map((id) => spriteParams(id));
    const near = nearestFish(params, 10, W, H, 500, 300);
    expect(near).toHaveLength(3);
    const ext = [500, 300, 10, ...near];
    const i = near[0];
    const free = swimPose(12.5, params[i], W, H);
    const fed = fishMotion(12.5, params[i], i, 5, W, H, ext);
    expect(Math.hypot(fed.x - 500, fed.y - 300)).toBeLessThan(Math.hypot(free.x - 500, free.y - 300));
    const other = [0, 1, 2, 3, 4].find((k) => !near.includes(k)) ?? 0;
    expect(fishMotion(12.5, params[other], other, 5, W, H, ext)).toEqual(swimPose(12.5, params[other], W, H));
    expect(feedWeight(6)).toBe(0);
    expect(feedWeight(2.5)).toBe(1);
  });
});
