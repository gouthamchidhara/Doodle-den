// AI coloring page post-process (A7 Feature 1): luminance < 160 → pure black, else pure white. Pure.
export const BW_THRESHOLD = 160;

// Returns a new RGBA buffer with only black and white pixels (alpha 255).
export function thresholdBW(rgba: Uint8Array): Uint8Array {
  const out = new Uint8Array(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3] / 255;
    const lum = (0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) * a + 255 * (1 - a);
    const v = lum < BW_THRESHOLD ? 0 : 255;
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = 255;
  }
  return out;
}
