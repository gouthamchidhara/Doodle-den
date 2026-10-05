// Trace paths (A5 Trace & Learn): letters A–Z / a–z, numbers 0–9, 8 shapes; normalized strokes in school order.
import type { XY } from '@/games/trace/traceEngine';

import paths from './tracePaths.json';
import words from './traceWords.json';

export type TraceKind = 'letter' | 'number' | 'shape';

export interface TracePath {
  id: string;
  kind: TraceKind;
  strokes: XY[][];
}

const toXY = (s: number[][]): XY[] => s.map((p) => [p[0], p[1]]);

export const TRACE_PATHS: TracePath[] = paths.map((p) => ({
  id: p.id,
  kind: p.kind === 'number' ? 'number' : p.kind === 'shape' ? 'shape' : 'letter',
  strokes: p.strokes.map(toXY),
}));

const WORDS: Record<string, { word: string; voice: string }> = words;

// Path by id.
export function getTracePath(id: string): TracePath | undefined {
  return TRACE_PATHS.find((p) => p.id === id);
}

// Word card + voice key for a finished trace.
export function traceWord(id: string): { word: string; voice: string } | undefined {
  return WORDS[id];
}

// Items on a picker tab (lowercase letters only in Big mode).
export function traceItems(tab: TraceKind, ageMode: 'little' | 'big'): TracePath[] {
  return TRACE_PATHS.filter((p) => p.kind === tab && (tab !== 'letter' || ageMode === 'big' || p.id === p.id.toUpperCase()));
}
