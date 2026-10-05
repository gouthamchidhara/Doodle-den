// Renders a decorated Sticker Book page to PNG with Skia (scene + placed stickers).
import { ImageFormat, PaintStyle, Skia, type SkCanvas } from '@shopify/react-native-skia';

import { exportSize } from '@/canvas/exportPng';
import type { StampShape } from '@/canvas/stamps';
import { colors } from '@/theme/tokens';

import { getScene, SCENE_H, SCENE_W } from './scenes';
import { stickerArt } from './stickerArt';

export interface Placement {
  key: string;
  stickerId: string;
  x: number; // 0..1 of the scene width (center)
  y: number; // 0..1 of the scene height
  size: number; // fraction of the scene width
}

// Fills shapes (optionally with the ink outline) in the current canvas transform.
function fillShapes(c: SkCanvas, shapes: StampShape[], outline: boolean): void {
  for (const s of shapes) {
    const p = Skia.Path.MakeFromSVGString(s.d);
    if (!p) continue;
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(Skia.Color(s.fill));
    c.drawPath(p, paint);
    if (outline) {
      const o = Skia.Paint();
      o.setAntiAlias(true);
      o.setStyle(PaintStyle.Stroke);
      o.setStrokeWidth(4);
      o.setColor(Skia.Color(colors.ink));
      c.drawPath(p, o);
    }
  }
}

// Base64 PNG of the page at a long edge ('' if rendering fails).
export function renderDecoratePng(sceneId: string, placements: Placement[], longEdge: number): string {
  const { width, height } = exportSize(SCENE_W / SCENE_H, longEdge);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return '';
  const c = surface.getCanvas();
  c.save();
  c.scale(width / SCENE_W, height / SCENE_H);
  fillShapes(c, getScene(sceneId).shapes, false);
  c.restore();
  for (const pl of placements) {
    const art = stickerArt(pl.stickerId);
    const size = pl.size * width;
    c.save();
    c.translate(pl.x * width - size / 2, pl.y * height - size / 2);
    c.scale(size / 120, size / 120);
    fillShapes(c, [{ d: 'M60 4a56 56 0 1 0 0.1 0z', fill: art.badge }], false);
    c.translate(18, 18);
    c.scale(0.84, 0.84);
    fillShapes(c, art.shapes, true);
    c.restore();
  }
  surface.flush();
  return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
}
