// Pure stroke helpers (A5 Input rules): normalize, thin, smooth, bounds, seeded random. No Skia here.
import type { StrokePoint } from '@/types/models';

export interface Pt {
  x: number;
  y: number;
}

export type PathCmd = { c: 'M'; x: number; y: number } | { c: 'L'; x: number; y: number } | { c: 'Q'; cx: number; cy: number; x: number; y: number };

export const MIN_POINT_DISTANCE_PX = 2;
export const DEFAULT_PRESSURE = 0.5;

// Normalizes a pixel point to 0..1 canvas space (t = ms since stroke start).
export function normalizePoint(x: number, y: number, w: number, h: number, p: number, t: number): StrokePoint {
  return { x: w > 0 ? x / w : 0, y: h > 0 ? y / h : 0, p: Math.min(1, Math.max(0, p)), t: Math.max(0, Math.round(t)) };
}

// Pixel position of a normalized point.
export function denormalize(p: { x: number; y: number }, w: number, h: number): Pt {
  return { x: p.x * w, y: p.y * h };
}

// True when the new point is far enough (>= 2 px) from the previous one to keep.
export function shouldKeepPoint(prev: StrokePoint | undefined, next: StrokePoint, w: number, h: number): boolean {
  if (!prev) return true;
  return Math.hypot((next.x - prev.x) * w, (next.y - prev.y) * h) >= MIN_POINT_DISTANCE_PX;
}

// Drops points closer than 2 px to the previously kept point.
export function thinPoints(points: StrokePoint[], w: number, h: number): StrokePoint[] {
  const out: StrokePoint[] = [];
  for (const p of points) if (shouldKeepPoint(out[out.length - 1], p, w, h)) out.push(p);
  return out;
}

// Width multiplier from pressure: 0.6 + p * 0.8.
export function pressureWidth(p: number): number {
  return 0.6 + p * 0.8;
}

// Quadratic curve through midpoints of consecutive points (pixel space).
export function smoothPath(points: Pt[]): PathCmd[] {
  if (points.length === 0) return [];
  const cmds: PathCmd[] = [{ c: 'M', x: points[0].x, y: points[0].y }];
  if (points.length === 1) return cmds;
  if (points.length === 2) {
    cmds.push({ c: 'L', x: points[1].x, y: points[1].y });
    return cmds;
  }
  for (let i = 1; i < points.length - 1; i += 1) {
    const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
    cmds.push({ c: 'Q', cx: points[i].x, cy: points[i].y, x: mid.x, y: mid.y });
  }
  const last = points[points.length - 1];
  cmds.push({ c: 'L', x: last.x, y: last.y });
  return cmds;
}

// Bounding box of normalized points (0..1), or null for an empty list.
export function strokeBounds(points: { x: number; y: number }[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

// Bounds of many strokes together.
export function docBounds(strokes: { points: { x: number; y: number }[] }[]) {
  return strokeBounds(strokes.flatMap((s) => s.points));
}

// 32-bit hash of a string (FNV-1a) used to seed random generators.
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Deterministic random generator (mulberry32) seeded from a string or number; returns values in [0, 1).
export function seededRandom(seed: string | number): () => number {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Total pixel length of a polyline.
export function polylineLength(points: Pt[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return len;
}

// Points every `spacing` px along a polyline (first point included), with direction angle.
export function samplesAlong(points: Pt[], spacing: number): { x: number; y: number; angle: number }[] {
  if (points.length === 0 || spacing <= 0) return [];
  const out = [{ x: points[0].x, y: points[0].y, angle: 0 }];
  let carry = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (seg === 0) continue;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    let d = spacing - carry;
    while (d <= seg) {
      out.push({ x: a.x + ((b.x - a.x) * d) / seg, y: a.y + ((b.y - a.y) * d) / seg, angle });
      d += spacing;
    }
    carry = seg - (d - spacing);
  }
  return out;
}

// Rainbow hue (degrees) at a distance along the stroke: (distance / 400 * 360 + seed) % 360.
export function rainbowHue(distance: number, seed: number): number {
  return (((distance / 400) * 360 + seed) % 360 + 360) % 360;
}
