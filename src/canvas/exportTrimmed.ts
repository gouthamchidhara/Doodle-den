// Transparent export trimmed to the drawing (world creatures, stickers).
import { ImageFormat, Skia } from '@shopify/react-native-skia';

import type { StrokeDoc } from '@/types/models';

import { renderDocImage } from './exportPng';
import { trimRect } from './trimRect';

// Base64 PNG of only the drawn part on transparency; the long edge of the trimmed image is at most `longEdge`.
export function exportTrimmedPng(doc: StrokeDoc, longEdge: number): string {
  const full = renderDocImage(doc, Math.max(1024, longEdge), { transparent: true });
  if (!full) return '';
  const r = trimRect(doc, full.width(), full.height());
  if (!r) return '';
  const scale = Math.min(1, longEdge / Math.max(r.width, r.height));
  const w = Math.max(1, Math.round(r.width * scale));
  const h = Math.max(1, Math.round(r.height * scale));
  const surface = Skia.Surface.MakeOffscreen(w, h);
  if (!surface) return '';
  const c = surface.getCanvas();
  c.clear(Skia.Color('transparent'));
  c.drawImageRect(full, Skia.XYWHRect(r.x, r.y, r.width, r.height), Skia.XYWHRect(0, 0, w, h), Skia.Paint());
  surface.flush();
  return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
}
