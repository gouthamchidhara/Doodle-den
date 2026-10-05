// Offscreen PNG export of a stroke document (A5 Saving: 2048 px long edge, thumb 400).
import { BlendMode, ImageFormat, Skia, type SkImage } from '@shopify/react-native-skia';

import type { StrokeDoc } from '@/types/models';

import { canvasUnit } from './brushes/brushSpecs';
import { resolveColor } from './color';
import { drawStrokes } from './renderStroke';

export interface ExportOpts {
  transparent?: boolean;
  overlay?: SkImage | null;
  symmetry?: 1 | 2 | 4 | 8;
  underlay?: SkImage | null;
}

// Pixel size for an aspect ratio and long edge.
export function exportSize(aspect: number, longEdge: number): { width: number; height: number } {
  const a = aspect > 0 ? aspect : 1;
  return a >= 1 ? { width: longEdge, height: Math.max(1, Math.round(longEdge / a)) } : { width: Math.max(1, Math.round(longEdge * a)), height: longEdge };
}

// Renders the document offscreen and returns the snapshot image (null if no GPU surface).
export function renderDocImage(doc: StrokeDoc, longEdge: number, opts: ExportOpts = {}): SkImage | null {
  const { width, height } = exportSize(doc.aspect, longEdge);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  if (opts.transparent) canvas.clear(Skia.Color('transparent'));
  else canvas.drawColor(Skia.Color(resolveColor(doc.background)));
  const rect = Skia.XYWHRect(0, 0, width, height);
  if (opts.underlay) canvas.drawImageRect(opts.underlay, Skia.XYWHRect(0, 0, opts.underlay.width(), opts.underlay.height()), rect, Skia.Paint());
  drawStrokes(canvas, doc.strokes, { width, height, unit: canvasUnit(width, height), symmetry: opts.symmetry });
  if (opts.overlay) {
    const p = Skia.Paint();
    p.setBlendMode(BlendMode.Multiply);
    canvas.drawImageRect(opts.overlay, Skia.XYWHRect(0, 0, opts.overlay.width(), opts.overlay.height()), rect, p);
  }
  surface.flush();
  return surface.makeImageSnapshot();
}

// Renders the document and encodes it as base64 PNG ('' when rendering fails).
export function exportPngBase64(doc: StrokeDoc, longEdge: number, opts: ExportOpts = {}): string {
  const img = renderDocImage(doc, longEdge, opts);
  return img ? img.encodeToBase64(ImageFormat.PNG, 100) : '';
}

// Re-encodes an image scaled to a long edge (used for thumbnails of non-stroke art).
export function scaleImageBase64(image: SkImage, longEdge: number): string {
  const { width, height } = exportSize(image.width() / image.height(), longEdge);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return '';
  const canvas = surface.getCanvas();
  canvas.drawImageRect(image, Skia.XYWHRect(0, 0, image.width(), image.height()), Skia.XYWHRect(0, 0, width, height), Skia.Paint());
  surface.flush();
  return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
}
