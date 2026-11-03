import { bedtimeText, skillsLine, tracedLetters, weekBars } from '@/games/parent/dashboard';
import type { TimeRules } from '@/types/models';

describe('dashboard helpers', () => {
  it('collects traced letters', () => {
    expect(tracedLetters(['trace_b', 'trace_A', 'color_x', 'trace_B'])).toEqual(['A', 'B']);
  });
  it('builds the skills line', () => {
    expect(skillsLine(['A', 'B', 'C'], 9)).toBe('Skills: traced letters A–C · discovered 9 colors');
    expect(skillsLine(['A', 'C'], 0)).toBe('Skills: traced letters A, C');
    expect(skillsLine([], 0)).toBe('Skills: just getting started');
  });
  it('labels week bars', () => {
    const bars = weekBars(
      [
        { kidId: 'k', dayKey: '2026-11-01', usedSec: 600, sessions: 1, extensionsUsed: 0, perActivitySec: {} },
        { kidId: 'k', dayKey: '2026-11-02', usedSec: 90, sessions: 1, extensionsUsed: 0, perActivitySec: {} },
      ],
      '2026-11-02',
    );
    expect(bars).toEqual([
      { label: 'S', minutes: 10, isToday: false },
      { label: 'M', minutes: 2, isToday: true },
    ]);
  });
  it('shows bedtime off', () => {
    expect(bedtimeText({ bedtimeEnabled: false } as TimeRules)).toBe('Off');
  });
});
