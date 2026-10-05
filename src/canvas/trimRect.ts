// Crop rectangle for "trim to the strokes' bounding box + 8 px" (A5 worlds, stickers). Pure.
import type { StrokeDoc } from '@/types/models';

import { BRUSHES, canvasUnit } from './brushes/brushSpecs';
import { docBounds } from './strokeModel';

export const TRIM_PAD_PX = 8;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Pixel rect (clamped to the image) covering every stroke incl. its width, plus 8 px; null when there are no strokes.
export function trimRect(doc: StrokeDoc, width: number, height: number): Rect | null {
  const b = docBounds(doc.strokes);
  if (!b) return null;
  const unit = canvasUnit(width, height);
  const half = Math.max(...doc.strokes.map((s) => (s.tool === 'neon' ? (BRUSHES.neon.glow?.[s.size] ?? 0) : BRUSHES[s.tool].widths[s.size] * 1.4) / 2)) * unit;
  const pad = half + TRIM_PAD_PX;
  const x0 = Math.max(0, Math.floor(b.minX * width - pad));
  const y0 = Math.max(0, Math.floor(b.minY * height - pad));
  const x1 = Math.min(width, Math.ceil(b.maxX * width + pad));
  const y1 = Math.min(height, Math.ceil(b.maxY * height + pad));
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}
