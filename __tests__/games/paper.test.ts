// T-054: keying thresholds on a sample image; the original photo file is gone after processing.
import { keyAlpha, keyPaper, lumSat } from '@/games/paper/keying';
import { processPhoto } from '@/games/paper/processPhoto';
import { safeNext } from '@/screens/parent/ParentGateScreen';

import { fsData } from '../helpers/mockFs';

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { PNG: 'png' },
  ImageManipulator: {
    manipulate: () => ({ resize: () => ({ renderAsync: async () => ({ saveAsync: async () => ({ uri: 'file:///tmp/resized.png', base64: 'abc', width: 10, height: 10 }) }) }) }),
  },
}));
jest.mock('@shopify/react-native-skia', () => ({
  AlphaType: { Unpremul: 3 },
  ColorType: { RGBA_8888: 4 },
  ImageFormat: { PNG: 4 },
  Skia: { Data: { fromBase64: () => ({}) }, Image: { MakeImageFromEncoded: () => null } },
}));

// 20×20 white paper (slightly gray, like a photo) with a 6×6 blue square.
function sample(): Uint8Array {
  const px = new Uint8Array(20 * 20 * 4);
  for (let i = 0; i < 400; i += 1) {
    const x = i % 20;
    const y = Math.floor(i / 20);
    const ink = x >= 7 && x < 13 && y >= 7 && y < 13;
    px.set(ink ? [40, 90, 220, 255] : [236, 234, 228, 255], i * 4);
  }
  return px;
}

describe('paper keying', () => {
  it('thresholds: clear paper, fade band, keep ink', () => {
    expect(keyAlpha(0.9, 0.05)).toBe(0);
    expect(keyAlpha(0.5, 0.05)).toBe(1);
    expect(keyAlpha(0.9, 0.5)).toBe(1);
    const mid = keyAlpha(0.77, 0.1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(lumSat(255, 255, 255)).toEqual({ L: 1, S: 0 });
  });

  it('keys the sample: paper transparent, square kept, crop around it with 4% padding', () => {
    const r = keyPaper(sample(), 20, 20);
    expect(r.rgba[3]).toBe(0);
    expect(r.rgba[(10 * 20 + 10) * 4 + 3]).toBe(255);
    expect(r.crop).toEqual({ x: 6, y: 6, width: 8, height: 8 });
  });

  it('no drawing when under 2% is visible', () => {
    const blank = new Uint8Array(20 * 20 * 4).fill(240);
    expect(keyPaper(blank, 20, 20).crop).toBeNull();
  });

  it('deletes the original photo even when processing fails', async () => {
    fsData.set('file:///tmp/photo.jpg', 'jpeg');
    fsData.set('file:///tmp/resized.png', 'png');
    const r = await processPhoto('file:///tmp/photo.jpg', 4000, 3000);
    expect(r.ok).toBe(false);
    expect(fsData.has('file:///tmp/photo.jpg')).toBe(false);
    expect(fsData.has('file:///tmp/resized.png')).toBe(false);
  });

  it('the gate only returns to kid screens that ask for a permission', () => {
    expect(safeNext('/paper?granted=1')).toBe('/paper?granted=1');
    expect(safeNext('/paper')).toBe('/parent');
  });
});
