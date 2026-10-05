// Undo/redo for strokes (A5): undo removes the last stroke, history 50, redo until a new stroke starts.
import type { Stroke, StrokeDoc } from '@/types/models';

export const HISTORY_LIMIT = 50;

export interface UndoState {
  redo: Stroke[];
  undoBudget: number;
}

// Fresh history (nothing to redo, 50 undos available).
export function newHistory(): UndoState {
  return { redo: [], undoBudget: HISTORY_LIMIT };
}

// Adds a finished stroke: clears redo and refills the undo budget.
export function addStroke(doc: StrokeDoc, stroke: Stroke): { doc: StrokeDoc; history: UndoState } {
  return { doc: { ...doc, strokes: [...doc.strokes, stroke] }, history: newHistory() };
}

// True when undo can remove a stroke.
export function canUndo(doc: StrokeDoc, h: UndoState): boolean {
  return doc.strokes.length > 0 && h.undoBudget > 0;
}

// True when a stroke can be put back.
export function canRedo(h: UndoState): boolean {
  return h.redo.length > 0;
}

// Removes the last stroke onto the redo stack.
export function undo(doc: StrokeDoc, h: UndoState): { doc: StrokeDoc; history: UndoState } {
  if (!canUndo(doc, h)) return { doc, history: h };
  const last = doc.strokes[doc.strokes.length - 1];
  return { doc: { ...doc, strokes: doc.strokes.slice(0, -1) }, history: { redo: [...h.redo, last], undoBudget: h.undoBudget - 1 } };
}

// Puts the most recently undone stroke back.
export function redo(doc: StrokeDoc, h: UndoState): { doc: StrokeDoc; history: UndoState } {
  if (!canRedo(h)) return { doc, history: h };
  const s = h.redo[h.redo.length - 1];
  return { doc: { ...doc, strokes: [...doc.strokes, s] }, history: { redo: h.redo.slice(0, -1), undoBudget: h.undoBudget + 1 } };
}

export const SAVE_BEFORE_CLEAR_MIN = 3;

// Hold-to-clear saves the drawing first when it has 3+ strokes (A5).
export function shouldSaveBeforeClear(doc: StrokeDoc): boolean {
  return doc.strokes.length >= SAVE_BEFORE_CLEAR_MIN;
}

// Empty drawing with the same background/aspect.
export function clearDoc(doc: StrokeDoc): StrokeDoc {
  return { ...doc, strokes: [] };
}

// New empty stroke document.
export function emptyDoc(aspect: number, background: StrokeDoc['background'] = 'white'): StrokeDoc {
  return { version: 1, aspect, background, strokes: [] };
}
