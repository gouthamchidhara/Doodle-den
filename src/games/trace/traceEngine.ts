// Trace & Learn engine (A5): progress along each stroke within a finger tolerance, 90% to complete, stars from accuracy.
export type XY = [number, number];

export const TOLERANCE_PX = { little: 28, big: 18 } as const;
export const COMPLETE_AT = 0.9;
const MAX_JUMP = 0.2; // progress may not skip ahead more than 20% of a stroke at once

export interface TraceStroke {
  pts: XY[]; // pixel space
  cum: number[]; // cumulative length at each point
  length: number;
}

export interface TraceState {
  strokeIndex: number;
  progress: number; // 0..1 of the current stroke
  inside: number;
  total: number;
  done: boolean;
}

// Converts normalized strokes to pixel strokes with cumulative lengths.
export function prepareStrokes(strokes: XY[][], width: number, height: number): TraceStroke[] {
  return strokes.map((s) => {
    const pts = s.map(([x, y]): XY => [x * width, y * height]);
    const cum = [0];
    for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, length: Math.max(1e-6, cum[cum.length - 1]) };
  });
}

// Fresh state.
export function newTrace(): TraceState {
  return { strokeIndex: 0, progress: 0, inside: 0, total: 0, done: false };
}

// Distance from a point to a stroke and the fraction (0..1) of the nearest spot, optionally within [from, to].
export function project(s: TraceStroke, x: number, y: number, from = 0, to = 1): { dist: number; fraction: number } {
  let best = { dist: Infinity, fraction: 0 };
  for (let i = 1; i < s.pts.length; i += 1) {
    if (s.cum[i] / s.length < from || s.cum[i - 1] / s.length > to) continue;
    const [ax, ay] = s.pts[i - 1];
    const [bx, by] = s.pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
    if (d < best.dist) best = { dist: d, fraction: (s.cum[i - 1] + t * Math.sqrt(len2)) / s.length };
  }
  return best;
}

// One finger point. Inside tolerance moves progress forward (no jumping far ahead); outside just pauses.
export function addPoint(state: TraceState, strokes: TraceStroke[], x: number, y: number, tolerance: number): TraceState {
  if (state.done) return state;
  const s = strokes[state.strokeIndex];
  const inside = project(s, x, y).dist <= tolerance;
  const near = project(s, x, y, Math.max(0, state.progress - MAX_JUMP), Math.min(1, state.progress + MAX_JUMP));
  const next: TraceState = { ...state, total: state.total + 1, inside: state.inside + (inside ? 1 : 0) };
  if (near.dist <= tolerance && near.fraction > next.progress) next.progress = near.fraction;
  if (next.progress >= COMPLETE_AT) {
    const last = next.strokeIndex === strokes.length - 1;
    return { ...next, strokeIndex: last ? next.strokeIndex : next.strokeIndex + 1, progress: last ? 1 : 0, done: last };
  }
  return next;
}

// Finger lifted: a stroke under 90% keeps its progress (the kid can carry on).
export function liftFinger(state: TraceState): TraceState {
  return state;
}

// Stars from accuracy: ≥ 90% → 3, ≥ 75% → 2, else 1 (finishing always earns 1).
export function starsFor(inside: number, total: number): 1 | 2 | 3 {
  const pct = total === 0 ? 1 : inside / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.75) return 2;
  return 1;
}
