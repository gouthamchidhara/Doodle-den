// Lock screen words per reason (A5 Lock screen).
import type { LockReason, LockState } from '@/lock/types';
import type { TimeRules } from '@/types/models';
import { formatClock } from '@/utils/time';

// Big headline.
export function lockHeadline(reason: LockReason): string {
  if (reason === 'cooldown') return 'Break time! The crayons are resting';
  if (reason === 'parent') return 'A grown-up paused play';
  return 'The crayons are sleeping now';
}

// Bottom-left "when play returns" line.
export function backText(state: LockState, rules: TimeRules | null, nowWall: number): string {
  const { reason, untilWallMs } = state.lock;
  if (reason === 'cooldown' && untilWallMs !== null) {
    const n = Math.max(1, Math.ceil((untilWallMs - nowWall) / 60_000));
    return n === 1 ? 'Back in 1 minute' : `Back in ${n} minutes`;
  }
  if (reason === 'bedtime') return `Back at ${formatClock(rules?.bedtimeEnd ?? '07:00')}`;
  if (reason === 'daily') return 'Back tomorrow';
  return 'Back when a grown-up says';
}

// Voice key for the headline.
export function lockVoice(reason: LockReason): string {
  return reason === 'cooldown' ? 'mascot_resting' : 'mascot_sleeping';
}
