// Pure drawing-engine tests: history (T-023), replay, colors, brush table, stamps (T-021/T-022).
import { BRUSHES, brushWidth, canvasUnit } from '@/canvas/brushes/brushSpecs';
import { hexToRgb, hslToHex, mixWithWhite, resolveColor, rgbToHex } from '@/canvas/color';
import {
  HISTORY_LIMIT,
  addStroke,
  canRedo,
  canUndo,
  clearDoc,
  emptyDoc,
  newHistory,
  redo,
  shouldSaveBeforeClear,
  undo,
} from '@/canvas/history';
import { REPLAY_CAP_MS, partialDoc, replayDurationMs } from '@/canvas/replay';
import { STAMPS, getStamp } from '@/canvas/stamps';
import type { Stroke } from '@/types/models';

function stroke(id: string, lastT = 100): Stroke {
  return { id, tool: 'crayon', color: 'tomato', size: 'M', points: [{ x: 0, y: 0, p: 0.5, t: 0 }, { x: 0.5, y: 0.5, p: 0.5, t: lastT }] };
}

describe('history', () => {
  it('undo removes the last stroke and redo puts it back', () => {
    let doc = emptyDoc(1);
    let h = newHistory();
    ({ doc, history: h } = addStroke(doc, stroke('a')));
    ({ doc, history: h } = addStroke(doc, stroke('b')));
    ({ doc, history: h } = undo(doc, h));
    expect(doc.strokes.map((s) => s.id)).toEqual(['a']);
    expect(canRedo(h)).toBe(true);
    ({ doc, history: h } = redo(doc, h));
    expect(doc.strokes.map((s) => s.id)).toEqual(['a', 'b']);
    expect(canRedo(h)).toBe(false);
  });

  it('a new stroke clears the redo stack', () => {
    let doc = emptyDoc(1);
    let h = newHistory();
    ({ doc, history: h } = addStroke(doc, stroke('a')));
    ({ doc, history: h } = undo(doc, h));
    ({ doc, history: h } = addStroke(doc, stroke('c')));
    expect(canRedo(h)).toBe(false);
    expect(doc.strokes.map((s) => s.id)).toEqual(['c']);
  });

  it('allows at most 50 undos in a row', () => {
    let doc = emptyDoc(1);
    let h = newHistory();
    for (let i = 0; i < 60; i += 1) ({ doc, history: h } = addStroke(doc, stroke(String(i))));
    for (let i = 0; i < 60; i += 1) ({ doc, history: h } = undo(doc, h));
    expect(doc.strokes).toHaveLength(60 - HISTORY_LIMIT);
    expect(canUndo(doc, h)).toBe(false);
  });

  it('undo on an empty doc does nothing', () => {
    const doc = emptyDoc(1);
    const h = newHistory();
    expect(undo(doc, h).doc).toBe(doc);
  });

  it('clear keeps background and saves first only with 3+ strokes', () => {
    let doc = emptyDoc(1.5, 'black');
    expect(shouldSaveBeforeClear(doc)).toBe(false);
    for (const id of ['a', 'b']) doc = addStroke(doc, stroke(id)).doc;
    expect(shouldSaveBeforeClear(doc)).toBe(false);
    doc = addStroke(doc, stroke('c')).doc;
    expect(shouldSaveBeforeClear(doc)).toBe(true);
    const cleared = clearDoc(doc);
    expect(cleared.strokes).toHaveLength(0);
    expect(cleared.background).toBe('black');
    expect(cleared.aspect).toBe(1.5);
  });
});

describe('replay', () => {
  it('caps at 8 s and uses real time when shorter', () => {
    const short = { ...emptyDoc(1), strokes: [stroke('a', 500)] };
    expect(replayDurationMs(short)).toBeLessThan(1000);
    const long = { ...emptyDoc(1), strokes: Array.from({ length: 20 }, (_, i) => stroke(String(i), 2000)) };
    expect(replayDurationMs(long)).toBe(REPLAY_CAP_MS);
  });

  it('partialDoc grows in stroke order and ends complete', () => {
    const doc = { ...emptyDoc(1), strokes: [stroke('a', 1000), stroke('b', 1000)] };
    expect(partialDoc(doc, 0, 4000).strokes.length).toBeLessThanOrEqual(1);
    const mid = partialDoc(doc, 2100, 4000);
    expect(mid.strokes[0].id).toBe('a');
    expect(mid.strokes[0].points).toHaveLength(2);
    expect(partialDoc(doc, 4000, 4000)).toBe(doc);
  });
});

describe('color', () => {
  it('resolves palette keys, custom hex and rainbow', () => {
    expect(resolveColor('#12AB34')).toBe('#12AB34');
    expect(resolveColor('rainbow')).toBe(resolveColor('tomato'));
    expect(resolveColor('nope')).toBe(resolveColor('black'));
  });

  it('hex round-trips and mixes with white', () => {
    expect(rgbToHex(...hexToRgb('#FF8000'))).toBe('#FF8000');
    expect(mixWithWhite('#000000', 0.5)).toBe('#808080');
    expect(hslToHex(0, 1, 0.5)).toBe('#FF0000');
    expect(hslToHex(120, 1, 0.5)).toBe('#00FF00');
  });
});

describe('brush table', () => {
  it('matches A5 widths at the reference canvas', () => {
    expect(BRUSHES.crayon.widths).toEqual({ S: 6, M: 14, L: 28 });
    expect(BRUSHES.watercolor.opacity).toBe(0.35);
    expect(BRUSHES.neon.glow).toEqual({ S: 16, M: 36, L: 72 });
    expect(canvasUnit(900, 600)).toBe(1);
    expect(brushWidth('marker', 'L', 2)).toBe(56);
    expect(brushWidth('stamp', 'M', 1, 2)).toBe(96);
  });
});

describe('stamps', () => {
  it('has 20 unique stamps and falls back to the first', () => {
    expect(STAMPS).toHaveLength(20);
    expect(new Set(STAMPS.map((s) => s.id)).size).toBe(20);
    expect(getStamp('missing').id).toBe(STAMPS[0].id);
    expect(getStamp('dino').label).toBe('Dino');
  });
});
