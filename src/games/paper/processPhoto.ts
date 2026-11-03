// Photo → keyed, cropped PNG. The original photo file is deleted right away; the photo never leaves the device.
import { AlphaType, ColorType, ImageFormat, Skia } from '@shopify/react-native-skia';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { keyPaper } from './keying';

export const PHOTO_LONG_EDGE = 1600;

export type PaperResult = { ok: true; png: string; width: number; height: number } | { ok: false; reason: 'no_drawing' | 'failed' };

// Deletes a captured photo file (missing is fine).
export function deletePhoto(uri: string): void {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn('[paper] delete photo failed', e);
  }
}

// Keys white paper out of an encoded image (base64) and crops it to the drawing.
export function keyEncodedImage(b64: string): PaperResult {
  const img = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(b64));
  if (!img) return { ok: false, reason: 'failed' };
  const w = img.width();
  const h = img.height();
  const info = { width: w, height: h, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul };
  const px = img.makeNonTextureImage()?.readPixels(0, 0, info);
  if (!(px instanceof Uint8Array)) return { ok: false, reason: 'failed' };
  const keyed = keyPaper(px, w, h);
  if (!keyed.crop) return { ok: false, reason: 'no_drawing' };
  const full = Skia.Image.MakeImage(info, Skia.Data.fromBytes(keyed.rgba), w * 4);
  const c = keyed.crop;
  const surface = Skia.Surface.MakeOffscreen(c.width, c.height);
  if (!full || !surface) return { ok: false, reason: 'failed' };
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  canvas.drawImageRect(full, Skia.XYWHRect(c.x, c.y, c.width, c.height), Skia.XYWHRect(0, 0, c.width, c.height), Skia.Paint());
  surface.flush();
  return { ok: true, png: surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100), width: c.width, height: c.height };
}

// Resize to 1600 px, key out the paper, crop, encode PNG. Always deletes the original photo.
export async function processPhoto(uri: string, photoW: number, photoH: number): Promise<PaperResult> {
  try {
    const landscape = photoW >= photoH;
    const ref = await ImageManipulator.manipulate(uri)
      .resize(landscape ? { width: PHOTO_LONG_EDGE } : { height: PHOTO_LONG_EDGE })
      .renderAsync();
    const saved = await ref.saveAsync({ format: SaveFormat.PNG, base64: true });
    deletePhoto(uri);
    if (saved.uri !== uri) deletePhoto(saved.uri);
    if (!saved.base64) return { ok: false, reason: 'failed' };
    return keyEncodedImage(saved.base64);
  } catch (e) {
    console.warn('[paper] processing failed', e);
    deletePhoto(uri);
    return { ok: false, reason: 'failed' };
  }
}

// Re-encodes a PNG (base64) at a smaller long edge, or returns it unchanged.
export function pngAtLongEdge(png: string, width: number, height: number, longEdge: number): string {
  if (longEdge >= Math.max(width, height)) return png;
  const img = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(png));
  if (!img) return png;
  const s = longEdge / Math.max(width, height);
  const w = Math.max(1, Math.round(width * s));
  const h = Math.max(1, Math.round(height * s));
  const surface = Skia.Surface.MakeOffscreen(w, h);
  if (!surface) return png;
  const c = surface.getCanvas();
  c.clear(Skia.Color('transparent'));
  c.drawImageRect(img, Skia.XYWHRect(0, 0, width, height), Skia.XYWHRect(0, 0, w, h), Skia.Paint());
  surface.flush();
  return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
}
