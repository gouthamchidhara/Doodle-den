// Skia bridges for coloring: line art → working RGBA pixels, fill layer bytes ↔ image / PNG.
import { AlphaType, ColorType, ImageFormat, Skia, type SkImage } from '@shopify/react-native-skia';

const info = (width: number, height: number) => ({ width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul });

// Draws `image` scaled to size×size on white and reads its RGBA bytes.
export function readScaledPixels(image: SkImage, size: number): Uint8Array | null {
  const surface = Skia.Surface.MakeOffscreen(size, size);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.drawColor(Skia.Color('white'));
  canvas.drawImageRect(image, Skia.XYWHRect(0, 0, image.width(), image.height()), Skia.XYWHRect(0, 0, size, size), Skia.Paint());
  surface.flush();
  const px = surface.makeImageSnapshot().makeNonTextureImage()?.readPixels(0, 0, info(size, size));
  return px instanceof Uint8Array ? px : null;
}

// Wraps RGBA bytes as an image (for drawing the fill layer).
export function imageFromRgba(rgba: Uint8Array, width: number, height: number): SkImage | null {
  return Skia.Image.MakeImage(info(width, height), Skia.Data.fromBytes(rgba), width * 4);
}

// PNG (base64) → RGBA bytes at size×size, or null.
export function rgbaFromPngBase64(b64: string, size: number): Uint8Array | null {
  const img = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(b64));
  if (!img) return null;
  const surface = Skia.Surface.MakeOffscreen(size, size);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  canvas.drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(0, 0, size, size), Skia.Paint());
  surface.flush();
  const px = surface.makeImageSnapshot().makeNonTextureImage()?.readPixels(0, 0, info(size, size));
  return px instanceof Uint8Array ? px : null;
}

// Fill layer bytes → base64 PNG ('' on failure).
export function rgbaToPngBase64(rgba: Uint8Array, width: number, height: number): string {
  return imageFromRgba(rgba, width, height)?.encodeToBase64(ImageFormat.PNG, 100) ?? '';
}
