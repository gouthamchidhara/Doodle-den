// Skia tracing board: dashed guide, green start dot + arrow, progress fill, finger trail (A5 Trace & Learn).
import { Canvas, Circle, DashPathEffect, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors } from '@/theme/tokens';

import { addPoint, newTrace, prepareStrokes, starsFor, type TraceState, type XY } from './traceEngine';

export interface TraceBoardProps {
  strokes: XY[][];
  size: number;
  tolerance: number;
  onDone: (stars: 1 | 2 | 3) => void;
}

// Polyline path from pixel points.
function toPath(pts: XY[]): SkPath {
  const p = Skia.Path.Make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  return p;
}

// Small arrow head at the start, pointing along the stroke.
function arrowPath(pts: XY[], len: number): SkPath {
  const [ax, ay] = pts[0];
  const [bx, by] = pts[Math.min(3, pts.length - 1)];
  const a = Math.atan2(by - ay, bx - ax);
  const tip: XY = [ax + Math.cos(a) * len * 2.2, ay + Math.sin(a) * len * 2.2];
  const l: XY = [tip[0] - Math.cos(a - 0.5) * len, tip[1] - Math.sin(a - 0.5) * len];
  const r: XY = [tip[0] - Math.cos(a + 0.5) * len, tip[1] - Math.sin(a + 0.5) * len];
  const p = Skia.Path.Make();
  p.moveTo(l[0], l[1]);
  p.lineTo(tip[0], tip[1]);
  p.lineTo(r[0], r[1]);
  return p;
}

// Square board the kid traces on.
export function TraceBoard({ strokes, size, tolerance, onDone }: TraceBoardProps) {
  const prepared = useMemo(() => prepareStrokes(strokes, size, size), [strokes, size]);
  const paths = useMemo(() => prepared.map((s) => toPath(s.pts)), [prepared]);
  const [state, setState] = useState<TraceState>(newTrace);
  const [trail, setTrail] = useState<XY[]>([]);
  const width = size * 0.07;

  const onPoint = (x: number, y: number) => {
    setTrail((t) => [...t.slice(-400), [x, y]]);
    setState((s) => addPoint(s, prepared, x, y, tolerance));
  };

  useEffect(() => {
    if (state.done) onDone(starsFor(state.inside, state.total));
    // Fires once when the last stroke completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .maxPointers(1)
    .runOnJS(true)
    .onBegin((e) => onPoint(e.x, e.y))
    .onUpdate((e) => onPoint(e.x, e.y))
    .onFinalize(() => setTrail([]));

  const cur = prepared[state.strokeIndex];
  const trailPath = trail.length > 1 ? toPath(trail) : null;

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{ width: size, height: size }} accessibilityLabel="Tracing board">
        {paths.map((p, i) =>
          i < state.strokeIndex || (state.done && i === state.strokeIndex) ? (
            <Path key={i} path={p} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" color={colors.leaf} />
          ) : (
            <Path key={i} path={p} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" color={colors.tint.leaf.border}>
              <DashPathEffect intervals={[width * 0.9, width * 0.7]} />
            </Path>
          ),
        )}
        {!state.done && cur ? (
          <>
            <Path path={paths[state.strokeIndex]} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" color={colors.leaf} start={0} end={state.progress} />
            <Circle cx={cur.pts[0][0]} cy={cur.pts[0][1]} r={width * 0.75} color={colors.leaf} />
            <Path path={arrowPath(cur.pts, width * 0.6)} style="stroke" strokeWidth={width * 0.25} strokeCap="round" strokeJoin="round" color={colors.white} />
          </>
        ) : null}
        {trailPath ? <Path path={trailPath} style="stroke" strokeWidth={width * 0.35} strokeCap="round" strokeJoin="round" color={colors.sky} opacity={0.8} /> : null}
      </Canvas>
    </GestureDetector>
  );
}
