// T-053: animals keep to their depth line and scale, idle-hop, snack pulls them side by side, back-to-front order.
import { animalMotion, DEPTH_SCALE, drawOrder, laneOf, walkPose } from '@/games/worlds/zoo/animalMotion';
import { spriteParams } from '@/games/worlds/spriteParams';

const W = 1200;
const H = 800;

describe('zoo motion', () => {
  it('each slot keeps its ground line and depth scale', () => {
    for (let i = 0; i < 16; i += 1) {
      const p = spriteParams(`a${i}`);
      const pose = walkPose(5, p, i, W, H);
      expect(pose.scale).toBe(DEPTH_SCALE[laneOf(i)]);
      expect(pose.x).toBeGreaterThanOrEqual(W * 0.08 - 1e-6);
      expect(pose.x).toBeLessThanOrEqual(W * 0.92 + 1e-6);
    }
  });

  it('stops and hops during idle time', () => {
    const p = { ...spriteParams('idle'), freq: 0, amp: 0 }; // walk 3 s, idle 1 s
    const a = walkPose(3.1, p, 0, W, H);
    const b = walkPose(3.9, p, 0, W, H);
    expect(a.x).toBeCloseTo(b.x);
    expect(walkPose(3.2, p, 0, W, H).y).toBeLessThan(walkPose(3.9, p, 0, W, H).y);
  });

  it('snack gathers animals side by side near the treat', () => {
    const xs = [0, 1, 2, 3].map((i) => animalMotion(10 + 3, spriteParams(`s${i}`), i, 4, W, H, [600, 10]).x);
    for (const x of xs) expect(Math.abs(x - 600)).toBeLessThan(W * 0.1);
    expect(new Set(xs.map((x) => Math.round(x))).size).toBe(4);
  });

  it('draws back lines first', () => {
    const order = drawOrder(6);
    expect(order.map(laneOf)).toEqual([0, 0, 1, 1, 2, 2]);
  });
});
