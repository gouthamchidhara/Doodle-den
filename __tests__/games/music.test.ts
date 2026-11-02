// T-057: a note every 140 ms of movement, volume by speed, events follow undo, replay plays the same song in sync.
import { emptyDoc } from '@/canvas/history';
import { liveEvents, newNoteClock, notePoint, replaySchedule, strokeOffsets, type NoteEvent } from '@/games/music/noteEvents';
import { COLOR_NOTE, noteForColor } from '@/games/music/notes';
import type { Stroke } from '@/types/models';

const pt = (x: number, t: number) => ({ x, y: 0.5, p: 0.5, t });
const stroke = (id: string, lastT: number): Stroke => ({ id, tool: 'marker', color: 'sky', size: 'L', points: [pt(0, 0), pt(0.5, lastT)] });

describe('music paint', () => {
  it('maps the 10 colors to the pentatonic notes', () => {
    expect(COLOR_NOTE.tomato).toBe('C4');
    expect(COLOR_NOTE.white).toBe('A5');
    expect(new Set(Object.values(COLOR_NOTE)).size).toBe(10);
    expect(noteForColor('#123456')).toBe('C4');
  });

  it('plays a note at the start, then every 140 ms of movement, louder when faster', () => {
    let c = newNoteClock(pt(0, 0), 1000, 1000);
    const first = notePoint(c, pt(0, 0), 1000, 1000, true);
    expect(first.volume).not.toBeNull();
    c = first.clock;
    const tooSoon = notePoint(c, pt(0.05, 100), 1000, 1000, false);
    expect(tooSoon.volume).toBeNull();
    const slow = notePoint(tooSoon.clock, pt(0.06, 150), 1000, 1000, false);
    expect(slow.volume).toBeGreaterThanOrEqual(0.4);
    const fast = notePoint(newNoteClock(pt(0, 0), 1000, 1000), pt(0.9, 150), 1000, 1000, false);
    expect(fast.volume).toBe(1);
    const still = notePoint(newNoteClock(pt(0, 0), 1000, 1000), pt(0, 300), 1000, 1000, false);
    expect(still.volume).toBeNull();
  });

  it('events follow strokes through undo and replay in sync', () => {
    const doc = { ...emptyDoc(1), strokes: [stroke('a', 1000), stroke('b', 1000)] };
    expect(strokeOffsets(doc).get('b')).toBe(1120);
    const events: NoteEvent[] = [
      { t: 0, note: 'C4', x: 0, y: 0, strokeId: 'a', dt: 100 },
      { t: 0, note: 'G4', x: 0, y: 0, strokeId: 'b', dt: 500 },
    ];
    expect(liveEvents(doc, events).map((e) => e.t)).toEqual([100, 1620]);
    expect(liveEvents({ ...doc, strokes: [doc.strokes[0]] }, events)).toHaveLength(1);
    const sched = replaySchedule(doc, events);
    expect(sched[0].at).toBeCloseTo(100);
    const long = { ...doc, strokes: Array.from({ length: 10 }, (_, i) => stroke(`s${i}`, 2000)) };
    const evs: NoteEvent[] = [{ t: 0, note: 'A4', x: 0, y: 0, strokeId: 's9', dt: 2000 }];
    expect(replaySchedule(long, evs)[0].at).toBeLessThanOrEqual(8000);
  });
});
