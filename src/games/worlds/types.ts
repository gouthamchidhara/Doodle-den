// Shared world engine types.
import type { WorldEntity } from '@/types/feature';

import type { SpriteParams } from './spriteParams';

export interface Creature {
  entity: WorldEntity;
  uri: string;
  params: SpriteParams;
}

export interface Pose {
  x: number; // center, px
  y: number; // bottom-center for ground worlds, center otherwise, px
  rotate: number; // degrees
  flip: boolean;
  scale: number;
}

// Motion worklet: time (s), params, slot index, count, scene size, extra 0..1 values the world drives (feed/race/snack).
export type MotionFn = (t: number, p: SpriteParams, index: number, count: number, width: number, height: number, ext: number[]) => Pose;
