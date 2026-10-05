// Brush table from A5 (widths in px at the 900 px reference canvas; phone canvases scale down naturally).
import type { BrushType } from '@/types/models';

export type SizeKey = 'S' | 'M' | 'L';

export interface BrushSpec {
  widths: Record<SizeKey, number>;
  opacity: number;
  blurSigma?: number;
  discrete?: { seg: number; dev: number };
  glow?: Record<SizeKey, number>;
}

export const REFERENCE_LONG_EDGE = 900;
export const PHONE_FACTOR = 0.8;
export const GLITTER_SPACING = 14;
export const STAMP_SPACING_FACTOR = 1.2;

export const BRUSHES: Record<BrushType, BrushSpec> = {
  crayon: { widths: { S: 6, M: 14, L: 28 }, opacity: 0.95, discrete: { seg: 4, dev: 1.5 } },
  marker: { widths: { S: 6, M: 14, L: 28 }, opacity: 1 },
  watercolor: { widths: { S: 11, M: 25, L: 50 }, opacity: 0.35, blurSigma: 3 },
  glitter: { widths: { S: 5, M: 11, L: 22 }, opacity: 0.6 },
  neon: { widths: { S: 4, M: 8, L: 16 }, opacity: 1, glow: { S: 16, M: 36, L: 72 }, blurSigma: 8 },
  eraser: { widths: { S: 14, M: 28, L: 56 }, opacity: 1 },
  stamp: { widths: { S: 48, M: 96, L: 160 }, opacity: 1 },
};

export const NEON_GLOW_OPACITY = 0.35;
export const NEON_CORE_WHITE_MIX = 0.5;

// Pixel scale for a canvas: long edge / 900, so exports match what the kid saw.
export function canvasUnit(width: number, height: number): number {
  return Math.max(width, height) / REFERENCE_LONG_EDGE;
}

// Stroke width in px for a brush, size, pressure multiplier and canvas unit.
export function brushWidth(tool: BrushType, size: SizeKey, unit: number, pressureMul = 1): number {
  return BRUSHES[tool].widths[size] * unit * (tool === 'stamp' ? 1 : pressureMul);
}
