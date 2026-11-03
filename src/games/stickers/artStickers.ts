// Stickers From My Art (A5): strokes → transparent trimmed export; otherwise white-paper keying of the PNG.
import { ART_STAMP_PREFIX, setStampImage } from '@/canvas/imageStamps';
import { parseStrokeDoc } from '@/canvas/saveArtwork';
import { listStickers, setSticker, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { fileUri, readBase64, readText, writeBase64 } from '@/services/files';

export const STICKER_LONG_EDGE = 512;

// Skia-backed helpers, loaded on first use so screens that only list stickers stay light.
/* eslint-disable @typescript-eslint/no-require-imports */
const skia = () => require('@shopify/react-native-skia') as typeof import('@shopify/react-native-skia');
const trimmed = () => require('@/canvas/exportTrimmed') as typeof import('@/canvas/exportTrimmed');
const paper = () => require('@/games/paper/processPhoto') as typeof import('@/games/paper/processPhoto');
/* eslint-enable @typescript-eslint/no-require-imports */

// Sticker file next to the artwork.
export const stickerPath = (kidId: string, artworkId: string) => `art/${kidId}/${artworkId}.sticker.png`;

// Makes (or remakes) a sticker from an artwork; false when no drawing was found.
export async function makeSticker(art: ArtworkRecord): Promise<boolean> {
  try {
    const doc = parseStrokeDoc(art.strokesPath ? await readText(art.strokesPath) : null);
    let png = '';
    if (doc && doc.strokes.length > 0 && art.activity !== 'coloring') png = trimmed().exportTrimmedPng(doc, STICKER_LONG_EDGE);
    else {
      const b64 = await readBase64(art.pngPath);
      const keyed = b64 ? paper().keyEncodedImage(b64) : null;
      png = keyed?.ok ? keyed.png : '';
    }
    if (!png) return false;
    const rel = stickerPath(art.kidId, art.id);
    writeBase64(rel, png);
    await setSticker(art.id, rel);
    return true;
  } catch (e) {
    console.warn('[stickers] make failed', e);
    return false;
  }
}

export interface ArtSticker {
  stampId: string;
  uri: string;
}

// The kid's art stickers; decodes them for the canvas stamp renderer.
export async function loadArtStickers(kidId: string): Promise<ArtSticker[]> {
  const out: ArtSticker[] = [];
  const stickers = await listStickers(kidId);
  if (stickers.length === 0) return out;
  const { Skia } = skia();
  for (const a of stickers) {
    if (!a.stickerPath) continue;
    const stampId = `${ART_STAMP_PREFIX}${a.id}`;
    const b64 = await readBase64(a.stickerPath);
    const img = b64 ? Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(b64)) : null;
    if (img) setStampImage(stampId, img);
    out.push({ stampId, uri: `${fileUri(a.stickerPath)}?v=${a.updatedAt}` });
  }
  return out;
}
