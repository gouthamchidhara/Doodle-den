// Loads a coloring page's line art + wall mask, and owns the tap-fill layer (bytes, image, undo, resume).
import { useImage, type SkImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useRef, useState } from 'react';

import { hexToRgb } from '@/canvas/color';
import { coloringSource, getColoringPage } from '@/content/coloringPages';
import { getArtwork } from '@/db/repositories/artworkRepo';
import { fileUri, readBase64, writeBase64 } from '@/services/files';

import { buildWallMask, emptyLayer, tapFill, WORK_SIZE } from './floodFill';
import { imageFromRgba, readScaledPixels, rgbaFromPngBase64, rgbaToPngBase64 } from './skiaPixels';

const FILL_UNDO = 5;

// Fill layer file next to the artwork (A5 Coloring step 5).
export const fillPath = (kidId: string, artworkId: string) => `art/${kidId}/${artworkId}.fill.png`;

// Line art source for bundled ('cat') or AI ('ai-<artworkId>') pages.
async function resolveSource(pageId: string): Promise<number | string | null> {
  if (pageId.startsWith('ai-')) {
    const art = await getArtwork(pageId.slice(3));
    return art ? fileUri(art.pngPath) : null;
  }
  const page = getColoringPage(pageId);
  const src = page ? coloringSource(page) : undefined;
  return typeof src === 'number' ? src : null;
}

// Everything the coloring screen needs about the page and its fills.
export function useColoringPage(pageId: string, resume: { kidId: string | null; artworkId: string | null }) {
  const [source, setSource] = useState<number | string | null>(null);
  const lineArt = useImage(source);
  const mask = useRef<Uint8Array | null>(null);
  const layer = useRef<Uint8Array>(emptyLayer(WORK_SIZE, WORK_SIZE));
  const undoStack = useRef<Uint8Array[]>([]);
  const filled = useRef(false);
  const [fillImage, setFillImage] = useState<SkImage | null>(null);
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    resolveSource(pageId)
      .then(setSource)
      .catch((e: unknown) => console.warn('[coloring] page load failed', e));
  }, [pageId]);

  useEffect(() => {
    if (!lineArt) return undefined;
    const t = setTimeout(() => {
      const px = readScaledPixels(lineArt, WORK_SIZE);
      mask.current = px ? buildWallMask(px, WORK_SIZE, WORK_SIZE) : null;
      setReady(!!mask.current);
    }, 0);
    return () => clearTimeout(t);
  }, [lineArt]);

  useEffect(() => {
    const { kidId, artworkId } = resume;
    if (!kidId || !artworkId) return;
    readBase64(fillPath(kidId, artworkId))
      .then((b64) => {
        const px = b64 ? rgbaFromPngBase64(b64, WORK_SIZE) : null;
        if (!px) return;
        layer.current = px;
        filled.current = true;
        setFillImage(imageFromRgba(px, WORK_SIZE, WORK_SIZE));
      })
      .catch((e: unknown) => console.warn('[coloring] fill load failed', e));
  }, [resume]);

  // Fills the area under a tap; x/y are 0..1 of the page. Returns true when something was painted.
  const fillAt = useCallback((x: number, y: number, hex: string): boolean => {
    const m = mask.current;
    if (!m) return false;
    const before = layer.current.slice();
    const n = tapFill(layer.current, m, WORK_SIZE, WORK_SIZE, x * (WORK_SIZE - 1), y * (WORK_SIZE - 1), hexToRgb(hex));
    if (n === 0) return false;
    undoStack.current = [...undoStack.current.slice(-(FILL_UNDO - 1)), before];
    filled.current = true;
    setFillImage(imageFromRgba(layer.current, WORK_SIZE, WORK_SIZE));
    setVersion((v) => v + 1);
    return true;
  }, []);

  // Undoes the last fill; false when there is none.
  const undoFill = useCallback((): boolean => {
    const prev = undoStack.current.pop();
    if (!prev) return false;
    layer.current = prev;
    setFillImage(imageFromRgba(prev, WORK_SIZE, WORK_SIZE));
    setVersion((v) => v + 1);
    return true;
  }, []);

  // True once anything was filled.
  const hasFills = useCallback(() => filled.current, []);

  // Writes the fill layer PNG for an artwork; returns the written path.
  const writeFill = useCallback(async (kidId: string, artworkId: string): Promise<string[]> => {
    const rel = fillPath(kidId, artworkId);
    writeBase64(rel, rgbaToPngBase64(layer.current, WORK_SIZE, WORK_SIZE));
    return [rel];
  }, []);

  return { lineArt, fillImage, ready, version, fillAt, undoFill, hasFills, writeFill };
}
