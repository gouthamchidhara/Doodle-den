// Shared state for drawing screens: doc, tool choices (with Little mode limits), undo flags, autosave, clear and done.
import { useCallback, useEffect, useState } from 'react';

import { emptyDoc, shouldSaveBeforeClear } from '@/canvas/history';
import { parseStrokeDoc } from '@/canvas/saveArtwork';
import { useAutosave } from '@/canvas/useAutosave';
import { listCustomColors } from '@/db/repositories/colorRepo';
import { getArtwork } from '@/db/repositories/artworkRepo';
import { readText } from '@/services/files';
import { useCanvasStore } from '@/state/canvasStore';
import { useSessionStore } from '@/state/sessionStore';
import type { ActivityKey, AgeMode, BrushType, CustomColor, StrokeDoc } from '@/types/models';

export const ALL_TOOLS: BrushType[] = ['crayon', 'marker', 'watercolor', 'glitter', 'neon', 'stamp', 'eraser'];
export const LITTLE_TOOLS: BrushType[] = ['crayon', 'marker', 'glitter', 'stamp', 'eraser'];

// Tools and sizes allowed for an age mode (A5 Free Draw: Little = 5 tools, sizes M and L).
export function toolLimits(ageMode: AgeMode): { tools: BrushType[]; sizes: ('S' | 'M' | 'L')[] } {
  return ageMode === 'little' ? { tools: LITTLE_TOOLS, sizes: ['M', 'L'] } : { tools: ALL_TOOLS, sizes: ['S', 'M', 'L'] };
}

export interface DrawingSessionOpts {
  activity: ActivityKey;
  artworkId?: string | null;
  background?: StrokeDoc['background'];
  exporter?: (doc: StrokeDoc, longEdge: number) => Promise<string>;
}

// Everything a drawing screen needs besides layout.
export function useDrawingSession(o: DrawingSessionOpts) {
  const kidId = useSessionStore((s) => s.activeKidId);
  const ageMode = useSessionStore((s) => s.ageMode);
  const store = useCanvasStore();
  const limits = toolLimits(ageMode);
  const tool = limits.tools.includes(store.tool) ? store.tool : 'crayon';
  const size = limits.sizes.includes(store.size) ? store.size : 'M';

  const [doc, setDoc] = useState<StrokeDoc>(() => emptyDoc(1, o.background ?? 'white'));
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [custom, setCustom] = useState<CustomColor[]>([]);
  const autosave = useAutosave({ kidId, activity: o.activity, doc, exporter: o.exporter, artworkId: o.artworkId });
  const { reset, save, markStarted } = autosave;

  useEffect(() => {
    if (!kidId) return;
    listCustomColors(kidId)
      .then(setCustom)
      .catch((e: unknown) => console.warn('[draw] colors failed', e));
  }, [kidId]);

  useEffect(() => {
    if (!o.artworkId) return;
    const id = o.artworkId;
    getArtwork(id)
      .then(async (a) => {
        const loaded = parseStrokeDoc(a?.strokesPath ? await readText(a.strokesPath) : null);
        if (!loaded) return;
        reset(id, loaded);
        setDoc(loaded);
      })
      .catch((e: unknown) => console.warn('[draw] load failed', e));
  }, [o.artworkId, reset]);

  // Keeps the doc aspect equal to the canvas box while the drawing is empty.
  const onCanvasSize = useCallback((width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    setDoc((d) => (d.strokes.length === 0 && Math.abs(d.aspect - width / height) > 0.001 ? { ...d, aspect: width / height } : d));
  }, []);

  // Hold-to-clear confirmed: saves first when 3+ strokes, then starts a new artwork.
  const clear = useCallback(async () => {
    if (shouldSaveBeforeClear(doc)) await save(true);
    reset();
    setDoc((d) => ({ ...d, strokes: [] }));
    setHistory({ canUndo: false, canRedo: false });
  }, [doc, save, reset]);

  // "I'm done!": saves now; returns the artwork id (null when nothing drawn).
  const finish = useCallback(async () => (doc.strokes.length > 0 ? save(true) : null), [doc, save]);

  // Fresh page after "New drawing".
  const newDrawing = useCallback(() => {
    reset();
    setDoc((d) => emptyDoc(d.aspect, d.background));
    setHistory({ canUndo: false, canRedo: false });
  }, [reset]);

  const setBackground = useCallback((bg: StrokeDoc['background']) => setDoc((d) => ({ ...d, background: bg })), []);

  return {
    kidId,
    ageMode,
    limits,
    tool,
    size,
    color: store.color,
    stampId: store.stampId,
    setTool: store.setTool,
    setColor: store.setColor,
    setSize: store.setSize,
    setStamp: store.setStamp,
    doc,
    setDoc,
    history,
    setHistory,
    custom,
    onCanvasSize,
    clear,
    finish,
    newDrawing,
    setBackground,
    markStarted,
  };
}
