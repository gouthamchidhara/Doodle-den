// Flipbook frames (A5 Flipbook Studio): 3–8 stroke documents, fps 2/4/8, looping playback.
import { emptyDoc } from '@/canvas/history';
import type { StrokeDoc } from '@/types/models';

export const MIN_FRAMES = 3;
export const MAX_FRAMES = 8;
export const SPEEDS = [2, 4, 8] as const;
export type Fps = (typeof SPEEDS)[number];

export interface FlipbookDraft {
  frames: StrokeDoc[];
  frameIds: (string | null)[]; // saved artwork id per frame
}

// Three blank frames.
export function newDraft(aspect: number): FlipbookDraft {
  return { frames: Array.from({ length: MIN_FRAMES }, () => emptyDoc(aspect)), frameIds: Array.from({ length: MIN_FRAMES }, () => null) };
}

// Adds a blank frame at the end (max 8).
export function addFrame(d: FlipbookDraft): FlipbookDraft {
  if (d.frames.length >= MAX_FRAMES) return d;
  return { frames: [...d.frames, emptyDoc(d.frames[0]?.aspect ?? 1)], frameIds: [...d.frameIds, null] };
}

// True when a frame may be deleted (never below 3).
export function canDelete(d: FlipbookDraft): boolean {
  return d.frames.length > MIN_FRAMES;
}

// Removes frame i; returns the new draft and the removed frame's saved id (to trash).
export function deleteFrame(d: FlipbookDraft, i: number): { draft: FlipbookDraft; removedId: string | null } {
  if (!canDelete(d) || i < 0 || i >= d.frames.length) return { draft: d, removedId: null };
  return {
    draft: { frames: d.frames.filter((_, k) => k !== i), frameIds: d.frameIds.filter((_, k) => k !== i) },
    removedId: d.frameIds[i],
  };
}

// Replaces frame i's strokes.
export function updateFrame(d: FlipbookDraft, i: number, doc: StrokeDoc): FlipbookDraft {
  return { ...d, frames: d.frames.map((f, k) => (k === i ? doc : f)) };
}

// Frame index shown `elapsedMs` into a looping playback.
export function frameAt(elapsedMs: number, fps: Fps, count: number): number {
  if (count <= 0) return 0;
  return Math.floor((Math.max(0, elapsedMs) * fps) / 1000) % count;
}

// True when at least one frame has strokes (worth saving).
export function hasDrawing(d: FlipbookDraft): boolean {
  return d.frames.some((f) => f.strokes.length > 0);
}
