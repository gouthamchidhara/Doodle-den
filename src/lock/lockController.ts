// Runs the lock engine for the active kid: load, tick, persist, usage writes and event effects (A4 Hook rules).
import { getRules } from '@/db/repositories/rulesRepo';
import { addUsage, incrementExtensions, incrementSessions } from '@/db/repositories/usageRepo';
import type { ActivityKey, TimeRules } from '@/types/models';

import { readClock as defaultReadClock } from './clock';
import { AUTOSAVE_TIMEOUT_MS, PERSIST_EVERY_SEC } from './constants';
import { applyRulesChange, createLockState, parentUnlock, requestFinishDrawing, tick, type ParentUnlockOption } from './lockEngine';
import { loadLockState, saveLockState } from './lockStorage';
import { useLockStore } from './lockStore';
import type { ClockReading, LockEvent, LockState } from './types';

export const USAGE_WRITE_EVERY_SEC = 60;
export const UI_EVENTS: LockEvent[] = ['WARN_5', 'WARN_1', 'BREAK'];

export interface LockEffects {
  autosave: () => Promise<void>;
  goLocked: () => void;
  goHome: () => void;
}

interface Running {
  kidId: string;
  state: LockState;
  rules: TimeRules;
  lastSaveUptime: number;
  usageBase: number;
}

// Waits for a promise, but never longer than `ms`.
async function withTimeout(p: Promise<void>, ms: number): Promise<void> {
  let t: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([p.catch((e: unknown) => console.warn('[lock] autosave failed', e)), new Promise<void>((r) => (t = setTimeout(r, ms)))]);
  if (t) clearTimeout(t);
}

export class LockController {
  private run: Running | null = null;
  private starting: Promise<boolean> | null = null;

  constructor(
    private effects: LockEffects,
    private readClock: () => ClockReading = defaultReadClock,
  ) {}

  // Swap navigation/save effects (root layout sets the real ones).
  setEffects(e: LockEffects): void {
    this.effects = e;
  }

  // Loads (or creates) the kid's state, runs one non-counting tick and saves. Resolves to "is locked".
  async start(kidId: string): Promise<boolean> {
    if (this.run?.kidId === kidId) return this.isLocked();
    if (this.starting) await this.starting;
    if (this.run?.kidId === kidId) return this.isLocked();
    this.starting = (async () => {
      if (this.run) await this.flush();
      const clock = this.readClock();
      const rules = await getRules(kidId);
      const loaded = (await loadLockState(kidId)) ?? createLockState(kidId, clock);
      const out = tick(loaded, rules, clock, { inKidArea: false });
      this.run = { kidId, state: out.state, rules, lastSaveUptime: clock.uptimeMs, usageBase: out.state.usedTodaySec };
      await saveLockState(out.state);
      useLockStore.getState().set(out.state, rules);
      await this.handle(out.events);
      return this.isLocked();
    })();
    try {
      return await this.starting;
    } finally {
      this.starting = null;
    }
  }

  // True when the running kid is locked.
  isLocked(): boolean {
    return !!this.run && this.run.state.lock.reason !== 'none';
  }

  // Current state (tests, parent screens).
  current(): LockState | null {
    return this.run?.state ?? null;
  }

  // One timer step while the app is active.
  async step(inKidArea: boolean, activity: ActivityKey | null = null): Promise<LockEvent[]> {
    const r = this.run;
    if (!r) return [];
    const clock = this.readClock();
    const prevDay = r.state.dayKey;
    const prevUsed = r.state.usedTodaySec;
    const out = tick(r.state, r.rules, clock, { inKidArea });
    r.state = out.state;
    useLockStore.getState().set(out.state, r.rules);

    if (out.state.dayKey !== prevDay) {
      await this.writeUsage(prevDay, prevUsed - r.usageBase, activity);
      r.usageBase = 0;
    } else if (out.state.usedTodaySec - r.usageBase >= USAGE_WRITE_EVERY_SEC) {
      await this.writeUsage(prevDay, out.state.usedTodaySec - r.usageBase, activity);
      r.usageBase = out.state.usedTodaySec;
    }
    if (out.events.length > 0 || clock.uptimeMs - r.lastSaveUptime >= PERSIST_EVERY_SEC * 1000 || clock.uptimeMs < r.lastSaveUptime) {
      r.lastSaveUptime = clock.uptimeMs;
      await saveLockState(out.state);
    }
    await this.handle(out.events);
    return out.events;
  }

  // App going to background: save state and pending usage.
  async flush(): Promise<void> {
    const r = this.run;
    if (!r) return;
    await this.writeUsage(r.state.dayKey, r.state.usedTodaySec - r.usageBase, null);
    r.usageBase = r.state.usedTodaySec;
    r.lastSaveUptime = this.readClock().uptimeMs;
    await saveLockState(r.state);
  }

  // "Finish my drawing" from the wind-down banner.
  async finishDrawing(): Promise<boolean> {
    const r = this.run;
    if (!r) return false;
    const out = requestFinishDrawing(r.state, r.rules);
    if (!out.granted) return false;
    r.state = out.state;
    useLockStore.getState().set(r.state, r.rules);
    await saveLockState(r.state);
    await incrementExtensions(r.kidId, r.state.dayKey).catch((e: unknown) => console.warn('[lock] extension count failed', e));
    return true;
  }

  // Parent unlock sheet (call only after Parent Gate).
  async parentUnlock(option: ParentUnlockOption): Promise<void> {
    const r = this.run;
    if (!r) return;
    const out = parentUnlock(r.state, option, this.readClock(), r.rules);
    r.state = out.state;
    useLockStore.getState().set(r.state, r.rules);
    await saveLockState(r.state);
    await this.handle(out.events);
  }

  // Rules saved in the parent zone: reload and re-check limits.
  async rulesChanged(kidId: string): Promise<void> {
    const r = this.run;
    if (!r || r.kidId !== kidId) return;
    const next = await getRules(kidId);
    const out = applyRulesChange(r.state, r.rules, next, this.readClock());
    r.state = out.state;
    r.rules = next;
    useLockStore.getState().set(r.state, r.rules);
    await saveLockState(r.state);
    await this.handle(out.events);
  }

  // Stops tracking (profile switch / delete).
  async stop(): Promise<void> {
    await this.flush();
    this.run = null;
    useLockStore.getState().reset();
  }

  private async writeUsage(dayKey: string, sec: number, activity: ActivityKey | null): Promise<void> {
    if (!this.run || sec <= 0) return;
    await addUsage(this.run.kidId, dayKey, sec, activity).catch((e: unknown) => console.warn('[lock] usage write failed', e));
  }

  private async handle(events: LockEvent[]): Promise<void> {
    if (events.length === 0) return;
    const r = this.run;
    useLockStore.getState().pushEvents(events.filter((e) => UI_EVENTS.includes(e)));
    if (events.includes('SESSION_START') && r) {
      await incrementSessions(r.kidId, r.state.dayKey).catch((e: unknown) => console.warn('[lock] session count failed', e));
    }
    if (events.includes('AUTOSAVE')) await withTimeout(this.effects.autosave(), AUTOSAVE_TIMEOUT_MS);
    if (events.includes('LOCK')) this.effects.goLocked();
    else if (events.includes('UNLOCK')) this.effects.goHome();
  }
}
