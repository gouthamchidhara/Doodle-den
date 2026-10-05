// Mixing Lab color math (A5): pair table first, else OKLab average (Björn Ottosson's sRGB ↔ OKLab).
import { hexToRgb, rgbToHex } from '@/canvas/color';
import mixTable from '@/content/mixTable.json';
import { colors, drawingPalette } from '@/theme/tokens';

export type PotKey = 'red' | 'yellow' | 'blue' | 'white' | 'black';

export const POTS: { key: PotKey; label: string; hex: string }[] = [
  { key: 'red', label: 'Red', hex: colors.tomato },
  { key: 'yellow', label: 'Yellow', hex: colors.sun },
  { key: 'blue', label: 'Blue', hex: colors.sky },
  { key: 'white', label: 'White', hex: colors.white },
  { key: 'black', label: 'Black', hex: colors.black },
];

export const MAX_BLOBS = 3;
export const NEW_COLOR_DISTANCE = 0.05;

export type Blob = { pot: PotKey } | { hex: string };
export type Lab = [number, number, number];

const TABLE: Record<string, string> = mixTable;

// sRGB channel (0..255) → linear 0..1.
const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
// Linear 0..1 → sRGB 0..255.
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

// '#RRGGBB' → OKLab.
export function hexToOklab(hex: string): Lab {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

// OKLab → '#RRGGBB' (clamped to sRGB).
export function oklabToHex([L, a, b]: Lab): string {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return rgbToHex(
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  );
}

// Euclidean OKLab distance.
export function oklabDistance(a: string, b: string): number {
  const x = hexToOklab(a);
  const y = hexToOklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// Hex for a blob.
export function blobHex(b: Blob): string {
  return 'pot' in b ? (POTS.find((p) => p.key === b.pot)?.hex ?? colors.white) : b.hex;
}

// Table entry for two pot colors (order-free).
export function tableLookup(a: PotKey, b: PotKey): string | undefined {
  return TABLE[[a, b].sort().join('+')];
}

// Result color for the bowl (null when empty).
export function mixBlobs(blobs: Blob[]): string | null {
  if (blobs.length === 0) return null;
  if (blobs.length === 1) return blobHex(blobs[0]).toUpperCase();
  const [a, b] = blobs;
  if (blobs.length === 2 && 'pot' in a && 'pot' in b) {
    if (a.pot === b.pot) return blobHex(a).toUpperCase();
    const hit = tableLookup(a.pot, b.pot);
    if (hit) return hit;
  }
  const labs = blobs.map((x) => hexToOklab(blobHex(x)));
  const avg = labs.reduce<Lab>((s, l) => [s[0] + l[0] / labs.length, s[1] + l[1] / labs.length, s[2] + l[2] / labs.length], [0, 0, 0]);
  return oklabToHex(avg);
}

// The 10 standard palette colors.
export function standardColors(): string[] {
  return drawingPalette.map((k) => colors[k]);
}

// A result is "new" when it is farther than 0.05 (OKLab) from every standard and saved custom color.
export function isNewColor(hex: string, saved: string[]): boolean {
  return [...standardColors(), ...saved].every((c) => oklabDistance(hex, c) > NEW_COLOR_DISTANCE);
}
