// Autosave (A5): every 10 s if changed, on app background, on lock AUTOSAVE (via canvasStore) and when leaving.
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useCanvasStore } from '@/state/canvasStore';
import type { ActivityKey, StrokeDoc } from '@/types/models';

import { exportPngBase64 } from './exportPng';
import { saveArtworkFiles } from './saveArtwork';

// Default exporter: plain stroke document on its background.
const defaultExporter = async (doc: StrokeDoc, longEdge: number) => exportPngBase64(doc, longEdge);

export const AUTOSAVE_MS = 10_000;

export interface AutosaveOpts {
  kidId: string | null;
  activity: ActivityKey;
  doc: StrokeDoc;
  exporter?: (doc: StrokeDoc, longEdge: number) => Promise<string>;
  artworkId?: string | null;
  onSaved?: (id: string) => void;
}

// Returns save() for explicit saves ("I'm done!"), reset() for a new drawing, and the current artwork id getter.
export function useAutosave(o: AutosaveOpts) {
  const opts = useRef(o);
  const state = useRef<{ id: string | null; savedDoc: StrokeDoc | null; startedAt: number; busy: Promise<string | null> | null }>({
    id: o.artworkId ?? null,
    savedDoc: o.doc,
    startedAt: 0,
    busy: null,
  });
  useLayoutEffect(() => {
    opts.current = o;
  });

  const save = useCallback(async (force = false): Promise<string | null> => {
    const s = state.current;
    if (s.busy) await s.busy;
    const { kidId, activity, doc, exporter = defaultExporter } = opts.current;
    if (!kidId || doc.strokes.length === 0) return s.id;
    const exp = (longEdge: number) => exporter(doc, longEdge);
    if (!force && doc === s.savedDoc) return s.id;
    if (s.startedAt === 0) s.startedAt = Date.now();
    const run = (async () => {
      try {
        const id = await saveArtworkFiles({ kidId, activity, artworkId: s.id, doc, exportPng: exp, durationSec: (Date.now() - s.startedAt) / 1000 });
        s.id = id;
        s.savedDoc = doc;
        opts.current.onSaved?.(id);
        return id;
      } catch (e) {
        console.warn('[canvas] save failed', e);
        return s.id;
      } finally {
        s.busy = null;
      }
    })();
    s.busy = run;
    return run;
  }, []);

  const reset = useCallback((artworkId: string | null = null, doc: StrokeDoc | null = null) => {
    state.current = { id: artworkId, savedDoc: doc, startedAt: 0, busy: null };
  }, []);

  const markStarted = useCallback(() => {
    if (state.current.startedAt === 0) state.current.startedAt = Date.now();
  }, []);

  const currentId = useCallback(() => state.current.id, []);

  useEffect(() => {
    const timer = setInterval(() => void save(), AUTOSAVE_MS);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background' || st === 'inactive') void save();
    });
    const unregister = useCanvasStore.getState().register(async () => {
      await save();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
      unregister();
      void save();
    };
  }, [save]);

  return { save, reset, markStarted, currentId };
}
