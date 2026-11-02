// White-paper keying (A5 Paper Comes Alive): paper → transparent, drawing kept; crop to the drawing + 4 %. Pure.
export const KEY_CLEAR = { L: 0.82, S: 0.15 } as const;
export const KEY_FADE = { L: 0.72, S: 0.22 } as const;
export const CROP_PAD = 0.04;
export const MIN_VISIBLE = 0.02;
const VISIBLE_ALPHA = 26; // ~0.1

// Alpha (0..1) for one pixel from its luminance L and saturation S (0..1).
export function keyAlpha(L: number, S: number): number {
  if (L > KEY_CLEAR.L && S < KEY_CLEAR.S) return 0;
  if (L > KEY_FADE.L && S < KEY_FADE.S) {
    const byL = (L - KEY_FADE.L) / (KEY_CLEAR.L - KEY_FADE.L);
    const byS = (KEY_FADE.S - S) / (KEY_FADE.S - KEY_CLEAR.S);
    return 1 - Math.max(0, Math.min(1, Math.min(byL, byS)));
  }
  return 1;
}

// Luminance and HSV saturation of an sRGB pixel.
export function lumSat(r: number, g: number, b: number): { L: number; S: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return { L: (0.299 * r + 0.587 * g + 0.114 * b) / 255, S: max === 0 ? 0 : (max - min) / max };
}

export interface KeyResult {
  rgba: Uint8Array; // keyed, full size
  crop: { x: number; y: number; width: number; height: number } | null; // null = no drawing found
  visible: number; // fraction of visible pixels
}

// Keys a photo in place (copy) and finds the crop box.
export function keyPaper(src: Uint8Array, width: number, height: number): KeyResult {
  const rgba = new Uint8Array(src);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      const { L, S } = lumSat(rgba[o], rgba[o + 1], rgba[o + 2]);
      const a = Math.round(keyAlpha(L, S) * rgba[o + 3]);
      rgba[o + 3] = a;
      if (a > VISIBLE_ALPHA) {
        count += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const visible = count / Math.max(1, width * height);
  if (maxX < 0 || visible < MIN_VISIBLE) return { rgba, crop: null, visible };
  const padX = Math.round(width * CROP_PAD);
  const padY = Math.round(height * CROP_PAD);
  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  return { rgba, crop: { x, y, width: Math.min(width, maxX + padX + 1) - x, height: Math.min(height, maxY + padY + 1) - y }, visible };
}
