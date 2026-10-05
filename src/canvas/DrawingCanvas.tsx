// The one reusable drawing surface (A5 Drawing engine): layers, cached finished strokes, live stroke, undo/redo, export, replay.
import { Canvas, createPicture, Fill, Group, Image, Path, Picture, Skia, type SkImage } from '@shopify/react-native-skia';
import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import type { BrushType, StrokeDoc, StrokePoint } from '@/types/models';

import { canvasUnit } from './brushes/brushSpecs';
import { resolveColor } from './color';
import { exportPngBase64 } from './exportPng';
import { addStroke, canRedo, canUndo, clearDoc, newHistory, redo, undo, type UndoState } from './history';
import { drawStroke, drawStrokes } from './renderStroke';
import { partialDoc, replayDurationMs } from './replay';
import { useStrokeInput } from './useStrokeInput';

export interface DrawingCanvasHandle {
  undo(): void;
  redo(): void;
  clear(): void;
  exportPng(longEdge: number): Promise<string>;
  replay(durationMs: number): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

export interface DrawingCanvasProps {
  doc: StrokeDoc;
  onChange: (doc: StrokeDoc) => void;
  tool: BrushType;
  color: string;
  size: 'S' | 'M' | 'L';
  stampId?: string;
  symmetry?: 1 | 2 | 4 | 8;
  ghost?: { image?: SkImage | null; pathSvg?: string; opacity: number };
  overlay?: SkImage | null;
  underlay?: SkImage | null;
  clipToSquare?: boolean;
  transparentBackground?: boolean;
  disabled?: boolean;
  onStrokePoint?: (p: StrokePoint) => void;
  onStrokeStart?: () => void;
  onHistoryChange?: (h: { canUndo: boolean; canRedo: boolean }) => void;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<DrawingCanvasHandle>;
}

// Controlled canvas: the parent owns `doc`; the canvas reports each finished stroke via onChange.
export function DrawingCanvas(props: DrawingCanvasProps) {
  const { doc, onChange, tool, color, size, stampId, symmetry = 1, ghost, overlay, underlay, transparentBackground, disabled, style, ref } = props;
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<UndoState>(newHistory);
  const [replayAt, setReplayAt] = useState<{ elapsed: number; total: number } | null>(null);
  const raf = useRef<number | null>(null);
  const docRef = useRef(doc);
  const histRef = useRef(history);
  useLayoutEffect(() => {
    docRef.current = doc;
    histRef.current = history;
  }, [doc, history]);

  const { width, height } = box;
  const unit = canvasUnit(width, height);
  const opts = useMemo(() => ({ width, height, unit, symmetry }), [width, height, unit, symmetry]);

  const commit = (next: { doc: StrokeDoc; history: UndoState }) => {
    setHistory(next.history);
    props.onHistoryChange?.({ canUndo: canUndo(next.doc, next.history), canRedo: canRedo(next.history) });
    onChange(next.doc);
  };

  const { gesture, live } = useStrokeInput({
    width,
    height,
    tool,
    color,
    size,
    stampId,
    enabled: !disabled && width > 0 && replayAt === null,
    onStrokeStart: props.onStrokeStart,
    onStrokePoint: props.onStrokePoint,
    onStrokeEnd: (s) => commit(addStroke(docRef.current, s)),
  });

  const shown = replayAt ? partialDoc(doc, replayAt.elapsed, replayAt.total) : doc;
  const finished = useMemo(
    () => (width > 0 ? createPicture((c) => drawStrokes(c, shown.strokes, opts), { width, height }) : null),
    [shown.strokes, opts, width, height],
  );
  const livePic = useMemo(() => (live && width > 0 ? createPicture((c) => drawStroke(c, live, opts), { width, height }) : null), [live, opts, width, height]);
  const ghostSvg = ghost?.pathSvg;
  const ghostPath = useMemo(() => {
    if (!ghostSvg || width === 0) return null;
    const p = Skia.Path.MakeFromSVGString(ghostSvg);
    if (!p) return null;
    p.transform(Skia.Matrix().scale(width, height));
    return p;
  }, [ghostSvg, width, height]);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  useImperativeHandle(ref, () => ({
    undo: () => commit(undo(docRef.current, histRef.current)),
    redo: () => commit(redo(docRef.current, histRef.current)),
    clear: () => commit({ doc: clearDoc(docRef.current), history: newHistory() }),
    exportPng: async (longEdge: number) => exportPngBase64(docRef.current, longEdge, { transparent: transparentBackground, overlay, underlay, symmetry }),
    canUndo: () => canUndo(docRef.current, histRef.current),
    canRedo: () => canRedo(histRef.current),
    replay: (durationMs: number) => {
      const total = replayDurationMs(docRef.current, durationMs);
      if (total <= 0) return;
      const start = Date.now();
      const step = () => {
        const elapsed = Date.now() - start;
        if (elapsed >= total) {
          setReplayAt(null);
          raf.current = null;
          return;
        }
        setReplayAt({ elapsed, total });
        raf.current = requestAnimationFrame(step);
      };
      step();
    },
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== box.width || h !== box.height) setBox({ width: w, height: h });
  };

  const full = { x: 0, y: 0, width, height };
  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.wrap, style]} onLayout={onLayout} accessibilityLabel="Drawing canvas">
        {width > 0 ? (
          <Canvas style={StyleSheet.absoluteFill}>
            {transparentBackground ? null : <Fill color={resolveColor(doc.background)} />}
            {underlay ? <Image image={underlay} {...full} fit="fill" /> : null}
            <Group layer>
              {finished ? <Picture picture={finished} /> : null}
              {livePic ? <Picture picture={livePic} /> : null}
            </Group>
            {overlay ? <Image image={overlay} {...full} fit="fill" /> : null}
            {ghost?.image ? <Image image={ghost.image} {...full} fit="contain" opacity={ghost.opacity} /> : null}
            {ghostPath ? (
              <Path path={ghostPath} style="stroke" strokeWidth={10 * unit} strokeCap="round" strokeJoin="round" color={resolveColor('grape')} opacity={ghost?.opacity ?? 0.35}>
                {null}
              </Path>
            ) : null}
          </Canvas>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
});
