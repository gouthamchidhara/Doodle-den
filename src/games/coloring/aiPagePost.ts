// Saves an AI coloring page: threshold to pure black/white with Skia, write the PNG, record ai_result.
import { AlphaType, ColorType, ImageFormat, Skia } from '@shopify/react-native-skia';

import { saveAiResult } from '@/db/repositories/aiResultRepo';
import { setMeta } from '@/db/repositories/metaRepo';
import { writeBase64 } from '@/services/files';

import { aiIdeaKey, aiPagePath } from './aiPages';
import { thresholdBW } from './threshold';

// Returns the page id ('ai-<resultId>') or null when the image could not be read.
export async function saveAiPage(kidId: string, resultId: string, imageBase64: string, idea: string): Promise<string | null> {
  const img = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(imageBase64));
  if (!img) return null;
  const w = img.width();
  const h = img.height();
  const info = { width: w, height: h, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul };
  const px = img.makeNonTextureImage()?.readPixels(0, 0, info);
  if (!(px instanceof Uint8Array)) return null;
  const bw = Skia.Image.MakeImage(info, Skia.Data.fromBytes(thresholdBW(px)), w * 4);
  if (!bw) return null;
  writeBase64(aiPagePath(kidId, resultId), bw.encodeToBase64(ImageFormat.PNG, 100));
  await saveAiResult({ id: resultId, kidId, feature: 'coloring_page', sourceArtworkId: null, outputArtworkId: null, createdAt: Date.now() });
  await setMeta(aiIdeaKey(resultId), idea);
  return `ai-${resultId}`;
}
