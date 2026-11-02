// Racetrack driving (A5): 80–160 px/s along the center path, rotated to the direction, one lane per car.
// Race: ext = [startSec, resumeSec]; 3 laps from the start line, each car parks after its 3rd lap (every car finishes);
// at resumeSec everyone cruises on from the start line.
import { lerp, type SpriteParams } from '../spriteParams';
import type { Pose } from '../types';

import { trackGeom, trackPoint } from './track';

export const LAPS = 3;
export const RACE_SPEED = { min: 120, max: 160 } as const;

// Sideways lane offset for slot `index` of `count`.
export function laneOffset(index: number, count: number, laneW: number): number {
  'worklet';
  if (count <= 1) return 0;
  return (index / (count - 1) - 0.5) * 2 * laneW * 1.6;
}

// Seconds a car needs for the race.
export function raceSeconds(p: SpriteParams, width: number, height: number): number {
  return (LAPS * trackGeom(width, height).length) / lerp(p.speed, RACE_SPEED.min, RACE_SPEED.max);
}

// Motion worklet used by the racetrack.
export function carMotion(t: number, p: SpriteParams, index: number, count: number, width: number, height: number, ext: number[]): Pose {
  'worklet';
  const g = trackGeom(width, height);
  const off = laneOffset(index, count, g.laneW);
  let s: number;
  if (ext.length >= 2 && t >= ext[1]) {
    s = LAPS * g.length + lerp(p.speed, 80, 160) * (t - ext[1]);
  } else if (ext.length >= 1 && t >= ext[0]) {
    const v = lerp(p.speed, RACE_SPEED.min, RACE_SPEED.max);
    s = Math.min(LAPS * g.length, v * (t - ext[0]));
  } else {
    s = p.start * g.length + lerp(p.speed, 80, 160) * t;
  }
  const pt = trackPoint(g, s, off);
  // Drawn cars face right (template), so rotation alone follows the track; flip on the top straight keeps them upright.
  const leftward = Math.cos((pt.angle * Math.PI) / 180) < 0;
  return { x: pt.x, y: pt.y, rotate: leftward ? pt.angle - 180 : pt.angle, flip: leftward, scale: 0.8 };
}
