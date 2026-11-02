// Note timing for Music Paint (A5): a note every 140 ms of movement, volume 0.4–1.0 by finger speed; replay in sync.
import { realDurationMs, replayDurationMs } from '@/canvas/replay';
import type { StrokeDoc, StrokePoint } from '@/types/models';

import type { Note } from './notes';

export const NOTE_EVERY_MS = 140;
const GAP_MS = 120; // same gap the replay timeline uses between strokes

export interface NoteEvent {
  t: number; // ms on the drawing's timeline
  note: Note;
  x: number;
  y: number;
  strokeId: string;
  dt: number; // ms into its stroke
}

export interface NoteClock {
  lastT: number;
  lastX: number;
  lastY: number;
  dist: number; // px moved since the last note
}

// Starts tracking a new stroke.
export function newNoteClock(p: StrokePoint, width: number, height: number): NoteClock {
  return { lastT: p.t, lastX: p.x * width, lastY: p.y * height, dist: 0 };
}

// Feeds a point; returns a volume when a note should play now (null otherwise) and the updated clock.
export function notePoint(c: NoteClock, p: StrokePoint, width: number, height: number, first: boolean): { clock: NoteClock; volume: number | null } {
  const x = p.x * width;
  const y = p.y * height;
  const dist = c.dist + Math.hypot(x - c.lastX, y - c.lastY);
  const elapsed = p.t - c.lastT;
  if (first) return { clock: { lastT: p.t, lastX: x, lastY: y, dist: 0 }, volume: 0.6 };
  if (elapsed < NOTE_EVERY_MS || dist <= 0) return { clock: { ...c, lastX: x, lastY: y, dist }, volume: null };
  const speed = dist / (elapsed / 1000); // px/s
  return { clock: { lastT: p.t, lastX: x, lastY: y, dist: 0 }, volume: Math.min(1, Math.max(0.4, 0.4 + speed / 2000)) };
}

// Timeline offset (ms) where each stroke starts, matching the replay timeline.
export function strokeOffsets(doc: StrokeDoc): Map<string, number> {
  const out = new Map<string, number>();
  let t = 0;
  for (const s of doc.strokes) {
    out.set(s.id, t);
    t += (s.points[s.points.length - 1]?.t ?? 0) + GAP_MS;
  }
  return out;
}

// Events that still belong to a stroke in the doc, with up-to-date timeline times (after undo).
export function liveEvents(doc: StrokeDoc, events: NoteEvent[]): NoteEvent[] {
  const off = strokeOffsets(doc);
  return events.filter((e) => off.has(e.strokeId)).map((e) => ({ ...e, t: (off.get(e.strokeId) ?? 0) + e.dt }));
}

// When each event should sound during a replay of the doc (ms from replay start).
export function replaySchedule(doc: StrokeDoc, events: NoteEvent[]): { at: number; e: NoteEvent }[] {
  const real = realDurationMs(doc.strokes);
  const total = replayDurationMs(doc);
  const scale = real > 0 ? total / real : 1;
  return liveEvents(doc, events).map((e) => ({ at: e.t * scale, e }));
}

// Plays the events in time with a replay; returns a cancel function.
export function scheduleNotes(doc: StrokeDoc, events: NoteEvent[], play: (note: Note, volume: number) => void): () => void {
  const timers = replaySchedule(doc, events).map(({ at, e }) => setTimeout(() => play(e.note, 0.8), at));
  return () => timers.forEach(clearTimeout);
}

// Parses a saved notes file.
export function parseNotes(json: string | null): NoteEvent[] {
  if (!json) return [];
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? (v as NoteEvent[]).filter((e) => typeof e?.t === 'number' && typeof e?.note === 'string') : [];
  } catch {
    return [];
  }
}
