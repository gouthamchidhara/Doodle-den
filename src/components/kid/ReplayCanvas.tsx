// Replays a saved drawing stroke by stroke (A5 Replay: total = min(8 s, real time)).
import { Canvas, createPicture, Fill, Picture } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';

import { canvasUnit } from '@/canvas/brushes/brushSpecs';
import { resolveColor } from '@/canvas/color';
import { drawStrokes } from '@/canvas/renderStroke';
import { partialDoc, replayDurationMs } from '@/canvas/replay';
import type { Symmetry } from '@/canvas/symmetry';
import type { StrokeDoc } from '@/types/models';

export interface ReplayCanvasProps {
  doc: StrokeDoc;
  width: number;
  height: number;
  symmetry?: Symmetry;
  onDone?: () => void;
}

// Plays once from an empty page; remount (key) to play again.
export function ReplayCanvas({ doc, width, height, symmetry = 1, onDone }: ReplayCanvasProps) {
  const total = replayDurationMs(doc);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      if (e >= total) {
        clearInterval(t);
        onDone?.();
      }
    }, 33);
    return () => clearInterval(t);
  }, [total, onDone]);
  const shown = partialDoc(doc, elapsed, total);
  const pic = useMemo(
    () => createPicture((c) => drawStrokes(c, shown.strokes, { width, height, unit: canvasUnit(width, height), symmetry }), { width, height }),
    [shown.strokes, width, height, symmetry],
  );
  return (
    <Canvas style={{ width, height }} accessibilityLabel="Replay">
      <Fill color={resolveColor(doc.background)} />
      <Picture picture={pic} />
    </Canvas>
  );
}
