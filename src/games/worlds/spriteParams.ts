// Per-creature motion values from a generator seeded with the entity id (A5), so each creature moves the same every time.
import { seededRandom } from '@/canvas/strokeModel';

export interface SpriteParams {
  speed: number; // 0..1 → mapped by each world to its px/s range
  amp: number; // 0..1
  freq: number; // 0..1
  phase: number; // 0..1
  lane: number; // 0..1
  start: number; // 0..1 starting position
  dir: 1 | -1;
}

// Deterministic params for an id.
export function spriteParams(id: string): SpriteParams {
  const r = seededRandom(id);
  return { speed: r(), amp: r(), freq: r(), phase: r(), lane: r(), start: r(), dir: r() < 0.5 ? 1 : -1 };
}

// Linear map of a 0..1 value into [min, max].
export function lerp(t: number, min: number, max: number): number {
  'worklet';
  return min + (max - min) * t;
}
