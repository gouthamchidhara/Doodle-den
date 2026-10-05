// Color helpers for the canvas: palette key → hex, mixing with white, HSL → hex.
import { colors, drawingPalette } from '@/theme/tokens';
import type { PaletteKey } from '@/types/models';

// True for one of the 10 drawing palette keys.
export function isPaletteKey(c: string): c is PaletteKey {
  return (drawingPalette as readonly string[]).includes(c);
}

// Resolves a stroke color (palette key or custom '#RRGGBB') to hex; 'rainbow' resolves to tomato.
export function resolveColor(c: string): string {
  if (isPaletteKey(c)) return colors[c];
  if (c === 'rainbow') return colors.tomato;
  return /^#[0-9a-f]{6}$/i.test(c) ? c : colors.black;
}

// Parses '#RRGGBB' into 0..255 channels.
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Formats 0..255 channels as '#RRGGBB'.
export function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

// Mixes a hex color with white (amount 0..1 of white).
export function mixWithWhite(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

// HSL (h in degrees, s/l in 0..1) to hex.
export function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
