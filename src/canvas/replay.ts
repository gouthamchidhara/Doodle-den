// Replay timeline (A5): strokes drawn in order using their t values; total = min(cap, real time).
import type { Stroke, StrokeDoc } from '@/types/models';

export const REPLAY_CAP_MS = 8000;
const GAP_MS = 120;

// Real drawing time of a stroke list (each stroke's last t plus a small gap).
export function realDurationMs(strokes: Stroke[]): number {
  return strokes.reduce((sum, s) => sum + (s.points[s.points.length - 1]?.t ?? 0) + GAP_MS, 0);
}

// Replay length: min(cap, real time).
export function replayDurationMs(doc: StrokeDoc, capMs = REPLAY_CAP_MS): number {
  return Math.min(capMs, realDurationMs(doc.strokes));
}

// The partial document visible `elapsedMs` into a replay lasting `totalMs`.
export function partialDoc(doc: StrokeDoc, elapsedMs: number, totalMs: number): StrokeDoc {
  const real = realDurationMs(doc.strokes);
  if (real === 0 || elapsedMs >= totalMs) return doc;
  let clock = (Math.max(0, elapsedMs) / Math.max(1, totalMs)) * real;
  const out: Stroke[] = [];
  for (const s of doc.strokes) {
    const dur = (s.points[s.points.length - 1]?.t ?? 0) + GAP_MS;
    if (clock >= dur) {
      out.push(s);
      clock -= dur;
      continue;
    }
    const pts = s.points.filter((p) => p.t <= clock);
    if (pts.length > 0) out.push({ ...s, points: pts });
    break;
  }
  return { ...doc, strokes: out };
}
