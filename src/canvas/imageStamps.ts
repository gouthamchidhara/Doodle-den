// Images that stamps can draw (kids' own art stickers, id 'art:<artworkId>'); loaded by the sticker service.
import type { SkImage } from '@shopify/react-native-skia';

const cache = new Map<string, SkImage>();

export const ART_STAMP_PREFIX = 'art:';

// True for a stamp id that points at an art sticker.
export function isArtStamp(id: string | undefined): id is string {
  return !!id && id.startsWith(ART_STAMP_PREFIX);
}

// Registers a decoded sticker image.
export function setStampImage(id: string, img: SkImage): void {
  cache.set(id, img);
}

// Image for an art stamp (undefined until loaded).
export function getStampImage(id: string): SkImage | undefined {
  return cache.get(id);
}
