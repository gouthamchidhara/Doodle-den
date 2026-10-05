// Pure lock engine (A4): tick + parent/kid actions. No React, Expo or storage imports.
import type { TimeRules } from '@/types/models';
import { isInBedtime, localDayKey, nextBedtimeEnd, nextLocalMidnight } from '@/utils/time';

import { CLOCK_TOLERANCE_MS, MAX_TICK_DELTA_SEC, SESSION_GAP_SEC, WARN_1_SEC, WARN_5_SEC } from './constants';
import type { ClockReading, LockEvent, LockState } from './types';

export type ParentUnlockOption = 'plus15' | 'plus30' | 'endSession' | 'endDay';

export interface Remaining {
  dailyLeftSec: number;
  sessionLeftSec: number;
  leftSec: number;
}

const NO_LOCK: LockState['lock'] = { reason: 'none', untilWallMs: null };

// Server-corrected wall time when an offset is known.
export function trustedWall(c: ClockReading): number {
  return c.serverOffsetMs === null ? c.wallMs : c.wallMs + c.serverOffsetMs;
}

// Deep copy so callers' state is never mutated (state is plain JSON data).
function clone(s: LockState): LockState {
  return { ...s, lock: { ...s.lock }, lastTick: { ...s.lastTick } };
}

// "End session" from A4: all session counters and warnings reset.
function endSession(s: LockState): void {
  s.sessionActive = false;
  s.sessionUsedSec = 0;
  s.extraSessionSec = 0;
  s.extensionsThisSession = 0;
  s.warned5 = false;
  s.warned1 = false;
}

// Starts a fresh session (step 7).
function startSession(s: LockState): void {
  s.sessionActive = true;
  s.sessionUsedSec = 0;
  s.extraSessionSec = 0;
  s.extensionsThisSession = 0;
  s.warned5 = false;
  s.warned1 = false;
  s.lastBreakAtSec = 0;
}

// Raw (possibly negative) time left.
function leftRaw(s: LockState, r: TimeRules): Remaining {
  const dailyLeftSec = r.dailyLimitMin * 60 + s.extraTodaySec - s.usedTodaySec;
  const sessionLeftSec = r.sessionLimitMin * 60 + s.extraSessionSec - s.sessionUsedSec;
  return { dailyLeftSec, sessionLeftSec, leftSec: Math.min(dailyLeftSec, sessionLeftSec) };
}

// New state for a kid with nothing used.
export function createLockState(kidId: string, clock: ClockReading): LockState {
  const wall = trustedWall(clock);
  return {
    version: 1,
    kidId,
    dayKey: localDayKey(wall),
    usedTodaySec: 0,
    extraTodaySec: 0,
    sessionActive: false,
    sessionUsedSec: 0,
    extraSessionSec: 0,
    extensionsThisSession: 0,
    warned5: false,
    warned1: false,
    lastBreakAtSec: 0,
    lock: { ...NO_LOCK },
    lastTick: { uptimeMs: clock.uptimeMs, wallMs: wall, bootId: clock.bootId },
    maxWallSeenMs: wall,
  };
}

// Time left today / this session / overall, never negative.
export function getRemaining(state: LockState, rules: TimeRules): Remaining {
  const r = leftRaw(state, rules);
  return { dailyLeftSec: Math.max(0, r.dailyLeftSec), sessionLeftSec: Math.max(0, r.sessionLeftSec), leftSec: Math.max(0, r.leftSec) };
}

// Step 8: warnings, break reminder, and locking at zero.
function checkLimits(s: LockState, rules: TimeRules, wall: number, events: LockEvent[]): void {
  const { dailyLeftSec, leftSec } = leftRaw(s, rules);
  if (leftSec <= WARN_5_SEC && !s.warned5) {
    s.warned5 = true;
    events.push('WARN_5');
  }
  if (leftSec <= WARN_1_SEC && !s.warned1) {
    s.warned1 = true;
    events.push('WARN_1');
  }
  if (rules.breakReminderMin !== null && s.sessionUsedSec - s.lastBreakAtSec >= rules.breakReminderMin * 60) {
    s.lastBreakAtSec = s.sessionUsedSec;
    events.push('BREAK');
  }
  if (leftSec <= 0) {
    events.push('AUTOSAVE', 'LOCK');
    s.lock = dailyLeftSec <= 0 ? { reason: 'daily', untilWallMs: nextLocalMidnight(wall) } : { reason: 'cooldown', untilWallMs: wall + rules.cooldownMin * 60_000 };
    endSession(s);
  }
}

// One engine step (A4 "tick() — exact algorithm").
export function tick(state: LockState, rules: TimeRules, clock: ClockReading, ctx: { inKidArea: boolean }): { state: LockState; events: LockEvent[] } {
  const s = clone(state);
  const events: LockEvent[] = [];

  // 1. DELTA
  const sameBoot = clock.bootId === s.lastTick.bootId;
  const uptimeDelta = sameBoot ? clock.uptimeMs - s.lastTick.uptimeMs : 0;
  const deltaSec = Math.min(MAX_TICK_DELTA_SEC, Math.max(0, uptimeDelta / 1000));

  // 2. WALL CLOCK (anti-tamper)
  let wall = trustedWall(clock);
  if (wall < s.maxWallSeenMs - CLOCK_TOLERANCE_MS) wall = s.maxWallSeenMs;
  if (sameBoot && clock.serverOffsetMs === null && wall - s.lastTick.wallMs - uptimeDelta > CLOCK_TOLERANCE_MS) {
    wall = s.lastTick.wallMs + uptimeDelta;
  }
  s.maxWallSeenMs = Math.max(s.maxWallSeenMs, wall);

  const finish = () => {
    s.lastTick = { uptimeMs: clock.uptimeMs, wallMs: wall, bootId: clock.bootId };
    return { state: s, events };
  };

  // 3. SESSION GAP
  if (s.sessionActive && wall - s.lastTick.wallMs > SESSION_GAP_SEC * 1000) endSession(s);

  // 4. NEW DAY
  const today = localDayKey(wall);
  if (today > s.dayKey) {
    s.dayKey = today;
    s.usedTodaySec = 0;
    s.extraTodaySec = 0;
    if (s.lock.reason === 'daily') {
      s.lock = { ...NO_LOCK };
      events.push('UNLOCK');
    }
  }

  // 5. BEDTIME
  if (rules.bedtimeEnabled && isInBedtime(wall, rules.bedtimeStart, rules.bedtimeEnd)) {
    const raw = leftRaw(s, rules);
    const parentExtraActive = s.sessionActive && s.extraSessionSec > 0 && raw.leftSec > 0;
    if (!(s.lock.reason === 'none' && parentExtraActive)) {
      if (s.lock.reason !== 'bedtime') {
        if (s.sessionActive) events.push('AUTOSAVE');
        s.lock = { reason: 'bedtime', untilWallMs: nextBedtimeEnd(wall, rules.bedtimeEnd) };
        endSession(s);
        events.push('LOCK');
      }
      return finish();
    }
  }

  // 6. EXPIRE TIMED LOCKS
  if ((s.lock.reason === 'cooldown' || s.lock.reason === 'bedtime') && s.lock.untilWallMs !== null && wall >= s.lock.untilWallMs) {
    s.lock = { ...NO_LOCK };
    events.push('UNLOCK');
  }
  if (s.lock.reason !== 'none') return finish();

  // 7. COUNT
  if (ctx.inKidArea) {
    if (!s.sessionActive) {
      startSession(s);
      events.push('SESSION_START');
    }
    s.usedTodaySec += deltaSec;
    s.sessionUsedSec += deltaSec;
  }

  // 8. CHECK LIMITS
  if (s.sessionActive) checkLimits(s, rules, wall, events);

  return finish();
}

// "Finish my drawing": one short extension at the last minute, limited per session.
export function requestFinishDrawing(state: LockState, rules: TimeRules): { state: LockState; granted: boolean } {
  const { leftSec } = getRemaining(state, rules);
  if (state.lock.reason !== 'none' || leftSec > WARN_1_SEC || state.extensionsThisSession >= rules.maxExtensionsPerSession) {
    return { state, granted: false };
  }
  const s = clone(state);
  s.extraSessionSec += rules.finishDrawingExtensionSec;
  s.extraTodaySec += rules.finishDrawingExtensionSec;
  s.extensionsThisSession += 1;
  return { state: s, granted: true };
}

// Parent unlock sheet (after Parent Gate). Plus options open a session holding exactly the granted time
// when lifting a bedtime lock, so bedtime re-locks when it runs out.
export function parentUnlock(
  state: LockState,
  option: ParentUnlockOption,
  clock: ClockReading,
  rules: TimeRules,
): { state: LockState; events: LockEvent[] } {
  const s = clone(state);
  const wall = Math.max(trustedWall(clock), s.maxWallSeenMs - CLOCK_TOLERANCE_MS);
  if (option === 'endSession' || option === 'endDay') {
    if (s.sessionActive) {
      endSession(s);
    }
    s.lock = option === 'endDay' ? { reason: 'daily', untilWallMs: nextLocalMidnight(wall) } : { reason: 'cooldown', untilWallMs: wall + rules.cooldownMin * 60_000 };
    return { state: s, events: ['AUTOSAVE', 'LOCK'] };
  }
  const sec = option === 'plus15' ? 900 : 1800;
  const wasBedtime = s.lock.reason === 'bedtime';
  if (!s.sessionActive) startSession(s);
  s.extraTodaySec += sec;
  s.extraSessionSec += sec;
  if (wasBedtime) {
    s.sessionUsedSec = Math.max(s.sessionUsedSec, rules.sessionLimitMin * 60);
    s.extraTodaySec = Math.max(s.extraTodaySec, s.usedTodaySec - rules.dailyLimitMin * 60 + sec);
  }
  s.warned5 = false;
  s.warned1 = false;
  s.lock = { ...NO_LOCK };
  return { state: s, events: ['UNLOCK'] };
}

// Parent changed the rules: unlock if the new limits leave time; lock if they leave none.
export function applyRulesChange(
  state: LockState,
  oldRules: TimeRules,
  newRules: TimeRules,
  clock: ClockReading,
): { state: LockState; events: LockEvent[] } {
  const s = clone(state);
  const events: LockEvent[] = [];
  const wall = Math.max(trustedWall(clock), s.maxWallSeenMs - CLOCK_TOLERANCE_MS);
  const { dailyLeftSec, leftSec } = leftRaw(s, newRules);
  if (s.lock.reason === 'daily' && dailyLeftSec > 0) {
    s.lock = { ...NO_LOCK };
    events.push('UNLOCK');
  } else if (s.lock.reason === 'cooldown' && s.lock.untilWallMs !== null) {
    const startedAt = s.lock.untilWallMs - oldRules.cooldownMin * 60_000;
    const until = startedAt + newRules.cooldownMin * 60_000;
    if (dailyLeftSec <= 0) s.lock = { reason: 'daily', untilWallMs: nextLocalMidnight(wall) };
    else if (wall >= until) {
      s.lock = { ...NO_LOCK };
      events.push('UNLOCK');
    } else s.lock = { reason: 'cooldown', untilWallMs: until };
  } else if (s.lock.reason === 'none' && s.sessionActive) {
    if (leftSec > WARN_5_SEC) s.warned5 = false;
    if (leftSec > WARN_1_SEC) s.warned1 = false;
    checkLimits(s, newRules, wall, events);
  }
  return { state: s, events };
}
