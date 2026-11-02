// Aquarium swim (A5): 20–60 px/s side to side, flipping at the edges, vertical bob sin(t·f)·amp (10–30 px).
// Feed: ext = [foodX, foodY, startSec, i1, i2, i3]; the 3 chosen fish steer to the food for 5 s.
import { lerp, type SpriteParams } from '../spriteParams';
import type { Pose } from '../types';

export const FEED_SEC = 5;
const MARGIN = 0.08;

// Plain swim pose (no feeding).
export function swimPose(t: number, p: SpriteParams, width: number, height: number): Pose {
  'worklet';
  const left = width * MARGIN;
  const travel = Math.max(1, width * (1 - MARGIN * 2));
  const speed = lerp(p.speed, 20, 60);
  const raw = p.start * travel * 2 + p.dir * speed * t;
  const pos = ((raw % (travel * 2)) + travel * 2) % (travel * 2);
  const goingRight = (pos < travel) === (p.dir === 1);
  const x = left + (pos < travel ? pos : travel * 2 - pos);
  const amp = lerp(p.amp, 10, 30);
  const freq = lerp(p.freq, 0.6, 1.6);
  const y = lerp(p.lane, height * 0.25, height * 0.7) + Math.sin(t * freq + p.phase * Math.PI * 2) * amp;
  // Template fish face left, so a fish swimming right is flipped.
  return { x, y, rotate: Math.sin(t * freq) * 4, flip: goingRight, scale: 1 };
}

// Smooth 0→1→0 envelope over the feeding window.
export function feedWeight(elapsed: number): number {
  'worklet';
  if (elapsed < 0 || elapsed > FEED_SEC) return 0;
  const k = Math.min(1, elapsed / 1, (FEED_SEC - elapsed) / 1);
  return k * k * (3 - 2 * k);
}

// Motion worklet used by the aquarium.
export function fishMotion(t: number, p: SpriteParams, index: number, _count: number, width: number, height: number, ext: number[]): Pose {
  'worklet';
  const base = swimPose(t, p, width, height);
  if (ext.length < 6) return base;
  const chosen = index === ext[3] || index === ext[4] || index === ext[5];
  const w = chosen ? feedWeight(t - ext[2]) : 0;
  if (w <= 0) return base;
  return { ...base, x: base.x + (ext[0] - base.x) * w * 0.9, y: base.y + (ext[1] - base.y) * w * 0.9, flip: ext[0] > base.x ? true : false };
}

// The 3 fish nearest the food at time t (JS side, when Feed is tapped).
export function nearestFish(params: SpriteParams[], t: number, width: number, height: number, fx: number, fy: number, n = 3): number[] {
  return params
    .map((p, i) => {
      const pose = swimPose(t, p, width, height);
      return { i, d: Math.hypot(pose.x - fx, pose.y - fy) };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.i);
}
