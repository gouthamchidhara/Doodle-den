// Draws strokes onto a Skia canvas with every brush look from A5 (used live, for caching, export and replay).
import {
  BlendMode,
  BlurStyle,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkCanvas,
  type SkPaint,
  type SkPath,
} from '@shopify/react-native-skia';

import type { Stroke } from '@/types/models';

import { BRUSHES, GLITTER_SPACING, NEON_CORE_WHITE_MIX, NEON_GLOW_OPACITY, STAMP_SPACING_FACTOR, brushWidth } from './brushes/brushSpecs';
import { hslToHex, mixWithWhite, resolveColor } from './color';
import { getStamp } from './stamps';
import { denormalize, polylineLength, pressureWidth, rainbowHue, samplesAlong, seededRandom, smoothPath, type Pt } from './strokeModel';

export interface RenderOpts {
  width: number;
  height: number;
  unit: number;
  symmetry?: 1 | 2 | 4 | 8;
}

// Builds a smooth Skia path from pixel points.
export function buildPath(points: Pt[]): SkPath {
  const path = Skia.Path.Make();
  for (const cmd of smoothPath(points)) {
    if (cmd.c === 'M') path.moveTo(cmd.x, cmd.y);
    else if (cmd.c === 'L') path.lineTo(cmd.x, cmd.y);
    else path.quadTo(cmd.cx, cmd.cy, cmd.x, cmd.y);
  }
  return path;
}

// Base stroke paint: color, width, round caps/joins, opacity.
function strokePaint(color: string, width: number, opacity: number): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setStyle(PaintStyle.Stroke);
  p.setStrokeCap(StrokeCap.Round);
  p.setStrokeJoin(StrokeJoin.Round);
  p.setStrokeWidth(width);
  p.setColor(Skia.Color(color));
  p.setAlphaf(opacity);
  return p;
}

// Average pressure of a stroke (single width per stroke keeps paths cheap).
function avgPressure(s: Stroke): number {
  if (s.points.length === 0) return 0.5;
  return s.points.reduce((sum, p) => sum + p.p, 0) / s.points.length;
}

// Draws the path, or a dot when the stroke is a single tap.
function drawShape(canvas: SkCanvas, pts: Pt[], paint: SkPaint): void {
  if (pts.length === 1 || polylineLength(pts) < 1) {
    const dot = paint.copy();
    dot.setStyle(PaintStyle.Fill);
    canvas.drawCircle(pts[0].x, pts[0].y, paint.getStrokeWidth() / 2, dot);
    return;
  }
  canvas.drawPath(buildPath(pts), paint);
}

// Rainbow color: short segments whose hue follows the distance along the stroke.
function drawRainbow(canvas: SkCanvas, pts: Pt[], s: Stroke, width: number, opacity: number): void {
  const seed = seededRandom(s.id)() * 360;
  if (pts.length < 2) {
    drawShape(canvas, pts, strokePaint(hslToHex(seed, 0.85, 0.55), width, opacity));
    return;
  }
  let dist = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const paint = strokePaint(hslToHex(rainbowHue(dist + seg / 2, seed), 0.85, 0.55), width, opacity);
    canvas.drawLine(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, paint);
    dist += seg;
  }
}

// Draws a 4-point sparkle star.
function drawStar(canvas: SkCanvas, x: number, y: number, r: number, angle: number, color: string): void {
  const path = Skia.Path.Make();
  for (let i = 0; i < 8; i += 1) {
    const a = angle + (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.38;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  canvas.drawPath(path, p);
}

// Draws one stamp centered at (x, y) with the given box size.
function drawStampAt(canvas: SkCanvas, stampId: string | undefined, x: number, y: number, size: number): void {
  const stamp = getStamp(stampId);
  canvas.save();
  canvas.translate(x - size / 2, y - size / 2);
  canvas.scale(size / 100, size / 100);
  for (const shape of stamp.shapes) {
    const path = Skia.Path.MakeFromSVGString(shape.d);
    if (!path) continue;
    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    fill.setColor(Skia.Color(shape.fill));
    canvas.drawPath(path, fill);
    const outline = strokePaint(resolveColor('black'), 4, 1);
    canvas.drawPath(path, outline);
  }
  canvas.restore();
}

// Draws one stroke in pixel space (no symmetry).
function drawOne(canvas: SkCanvas, s: Stroke, o: RenderOpts): void {
  if (s.points.length === 0) return;
  const pts = s.points.map((p) => denormalize(p, o.width, o.height));
  const spec = BRUSHES[s.tool];
  const width = brushWidth(s.tool, s.size, o.unit, pressureWidth(avgPressure(s)));
  const color = resolveColor(s.color);

  switch (s.tool) {
    case 'stamp': {
      const size = brushWidth('stamp', s.size, o.unit);
      const spots = pts.length === 1 ? [pts[0]] : samplesAlong(pts, size * STAMP_SPACING_FACTOR);
      for (const spot of spots) drawStampAt(canvas, s.stampId, spot.x, spot.y, size);
      return;
    }
    case 'eraser': {
      const p = strokePaint(color, width, 1);
      p.setBlendMode(BlendMode.Clear);
      drawShape(canvas, pts, p);
      return;
    }
    case 'neon': {
      const glowW = (spec.glow?.[s.size] ?? width) * o.unit;
      const base = s.color === 'rainbow' ? hslToHex(seededRandom(s.id)() * 360, 0.85, 0.55) : color;
      const glow = strokePaint(base, glowW, NEON_GLOW_OPACITY);
      glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, (spec.blurSigma ?? 8) * o.unit, true));
      drawShape(canvas, pts, glow);
      drawShape(canvas, pts, strokePaint(mixWithWhite(base, NEON_CORE_WHITE_MIX), width, 1));
      return;
    }
    case 'glitter': {
      if (s.color === 'rainbow') drawRainbow(canvas, pts, s, width, spec.opacity);
      else drawShape(canvas, pts, strokePaint(color, width, spec.opacity));
      const rnd = seededRandom(s.id);
      for (const spot of samplesAlong(pts, GLITTER_SPACING * o.unit)) {
        const r = (3 + rnd() * 4) * o.unit;
        drawStar(canvas, spot.x + (rnd() - 0.5) * width, spot.y + (rnd() - 0.5) * width, r, rnd() * Math.PI, rnd() < 0.5 ? resolveColor('white') : resolveColor('sun'));
      }
      return;
    }
    default: {
      if (s.color === 'rainbow') {
        drawRainbow(canvas, pts, s, width, spec.opacity);
        return;
      }
      const p = strokePaint(color, width, spec.opacity);
      if (spec.discrete) p.setPathEffect(Skia.PathEffect.MakeDiscrete(spec.discrete.seg * o.unit, spec.discrete.dev * o.unit, 0));
      if (spec.blurSigma) p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, spec.blurSigma * o.unit, true));
      drawShape(canvas, pts, p);
    }
  }
}

// Draws one stroke with kaleidoscope symmetry (2 = mirror, 4/8 = rotations around the center).
export function drawStroke(canvas: SkCanvas, s: Stroke, o: RenderOpts): void {
  const n = o.symmetry ?? 1;
  const cx = o.width / 2;
  const cy = o.height / 2;
  if (n === 1) {
    drawOne(canvas, s, o);
    return;
  }
  if (n === 2) {
    drawOne(canvas, s, o);
    canvas.save();
    canvas.translate(o.width, 0);
    canvas.scale(-1, 1);
    drawOne(canvas, s, o);
    canvas.restore();
    return;
  }
  for (let i = 0; i < n; i += 1) {
    canvas.save();
    canvas.rotate((360 / n) * i, cx, cy);
    drawOne(canvas, s, o);
    canvas.restore();
  }
}

// Draws every stroke inside its own layer so the eraser only clears strokes, never the background.
export function drawStrokes(canvas: SkCanvas, strokes: Stroke[], o: RenderOpts): void {
  canvas.saveLayer();
  for (const s of strokes) drawStroke(canvas, s, o);
  canvas.restore();
}
