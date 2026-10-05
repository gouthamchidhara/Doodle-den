// Zustand store for the running lock: current state + rules, seconds left, and the UI event queue.
import { create } from 'zustand';

import type { TimeRules } from '@/types/models';

import { getRemaining } from './lockEngine';
import type { LockEvent, LockState } from './types';

interface LockStoreState {
  state: LockState | null;
  rules: TimeRules | null;
  remainingSec: number | null;
  events: LockEvent[];
  set: (state: LockState, rules: TimeRules) => void;
  pushEvents: (events: LockEvent[]) => void;
  takeEvents: () => LockEvent[];
  reset: () => void;
}

export const useLockStore = create<LockStoreState>((set, get) => ({
  state: null,
  rules: null,
  remainingSec: null,
  events: [],
  set: (state, rules) => set({ state, rules, remainingSec: getRemaining(state, rules).leftSec }),
  pushEvents: (events) => {
    if (events.length > 0) set({ events: [...get().events, ...events] });
  },
  takeEvents: () => {
    const ev = get().events;
    if (ev.length > 0) set({ events: [] });
    return ev;
  },
  reset: () => set({ state: null, rules: null, remainingSec: null, events: [] }),
}));

// True when the current kid is locked.
export function isLockedNow(): boolean {
  const s = useLockStore.getState().state;
  return !!s && s.lock.reason !== 'none';
}
