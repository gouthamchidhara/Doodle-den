// Small Skia preview of one flipbook frame (thumbnail strip and playback).
import { Canvas, createPicture, Fill, Picture } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { canvasUnit } from '@/canvas/brushes/brushSpecs';
import { resolveColor } from '@/canvas/color';
import { drawStrokes } from '@/canvas/renderStroke';
import type { StrokeDoc } from '@/types/models';

// Frame drawn at the given size.
export function FrameThumb({ doc, width, height }: { doc: StrokeDoc; width: number; height: number }) {
  const pic = useMemo(
    () => createPicture((c) => drawStrokes(c, doc.strokes, { width, height, unit: canvasUnit(width, height) }), { width, height }),
    [doc, width, height],
  );
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Fill color={resolveColor(doc.background)} />
      <Picture picture={pic} />
    </Canvas>
  );
}
