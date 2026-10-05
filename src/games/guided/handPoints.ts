// Points along a normalized SVG path for the hand hint (Skia contour measuring).
import { Skia } from '@shopify/react-native-skia';

// Up to `count` evenly spaced points (pixel space) along every contour of the path.
export function handPoints(pathSvg: string, width: number, height: number, count = 40): [number, number][] {
  const path = pathSvg ? Skia.Path.MakeFromSVGString(pathSvg) : null;
  if (!path) return [];
  path.transform(Skia.Matrix().scale(width, height));
  const contours = [];
  const iter = Skia.ContourMeasureIter(path, false, 1);
  for (let c = iter.next(); c; c = iter.next()) contours.push(c);
  const total = contours.reduce((s, c) => s + c.length(), 0);
  if (total <= 0) return [];
  const out: [number, number][] = [];
  for (const c of contours) {
    const n = Math.max(2, Math.round((c.length() / total) * count));
    for (let i = 0; i < n; i += 1) {
      const [pos] = c.getPosTan((c.length() * i) / (n - 1));
      out.push([pos.x, pos.y]);
    }
  }
  return out;
}
