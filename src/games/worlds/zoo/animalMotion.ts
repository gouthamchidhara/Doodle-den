// Zoo walking (A5): three ground lines (scale 0.7 / 0.85 / 1.0), walk left/right with 1–3 s idle stops and a hop.
// Snack: ext = [treatX, startSec]; everyone hops toward the treat (side by side) for 6 s.
import { lerp, type SpriteParams } from '../spriteParams';
import type { Pose } from '../types';

export const GROUND = [0.6, 0.74, 0.9] as const;
export const DEPTH_SCALE = [0.7, 0.85, 1] as const;
export const SNACK_SEC = 6;
const HOP_SEC = 0.45;
const MARGIN = 0.08;

// Ground line (0 = back, 2 = front) for a slot.
export function laneOf(index: number): 0 | 1 | 2 {
  'worklet';
  const l = index % 3;
  return l === 0 ? 0 : l === 1 ? 1 : 2;
}

// Height of a hop at `phase` seconds into it.
function hop(phase: number, h: number): number {
  'worklet';
  return phase >= 0 && phase < HOP_SEC ? Math.sin((phase / HOP_SEC) * Math.PI) * h : 0;
}

// Walk pose without a snack.
export function walkPose(t: number, p: SpriteParams, index: number, width: number, height: number): Pose {
  'worklet';
  const lane = laneOf(index);
  const scale = DEPTH_SCALE[lane];
  const walk = lerp(p.freq, 3, 6);
  const idle = lerp(p.amp, 1, 3);
  const cycle = walk + idle;
  const k = Math.floor(t / cycle);
  const inCycle = t - k * cycle;
  const walked = k * walk + Math.min(inCycle, walk);
  const travel = Math.max(1, width * (1 - MARGIN * 2));
  const raw = p.start * travel * 2 + p.dir * lerp(p.speed, 25, 55) * scale * walked;
  const pos = ((raw % (travel * 2)) + travel * 2) % (travel * 2);
  const goingRight = (pos < travel) === (p.dir === 1);
  const x = width * MARGIN + (pos < travel ? pos : travel * 2 - pos);
  const up = inCycle > walk ? hop(inCycle - walk, height * 0.04 * scale) : 0;
  const bob = inCycle <= walk ? Math.abs(Math.sin(walked * 6)) * height * 0.006 : 0;
  const y = height * GROUND[lane] - height * 0.08 * scale - up - bob;
  return { x, y, rotate: 0, flip: goingRight, scale };
}

// Motion worklet used by the zoo.
export function animalMotion(t: number, p: SpriteParams, index: number, count: number, width: number, height: number, ext: number[]): Pose {
  'worklet';
  const base = walkPose(t, p, index, width, height);
  if (ext.length < 2) return base;
  const e = t - ext[1];
  if (e < 0 || e > SNACK_SEC) return base;
  const k = Math.min(1, e / 1.5, (SNACK_SEC - e) / 1.5);
  const w = k * k * (3 - 2 * k);
  const spot = ext[0] + (index - (count - 1) / 2) * width * 0.05;
  const x = base.x + (spot - base.x) * w;
  const up = hop(e % 0.6, height * 0.05 * base.scale) * w;
  return { ...base, x, y: base.y - up, flip: spot > base.x };
}

// Draw order back → front so nearer animals cover farther ones.
export function drawOrder(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i).sort((a, b) => laneOf(a) - laneOf(b) || a - b);
}
