// In-memory parent unlock window (A5 Parent Gate): 5 minutes after a correct PIN, cleared on leaving.
import { create } from 'zustand';

export const PARENT_UNLOCK_MS = 5 * 60_000;

export interface ParentState {
  unlockedUntil: number | null;
  unlock: (nowWall?: number) => void;
  clear: () => void;
}

// Global parent-unlock store (never persisted).
export const useParentStore = create<ParentState>((set) => ({
  unlockedUntil: null,
  unlock: (nowWall = Date.now()) => set({ unlockedUntil: nowWall + PARENT_UNLOCK_MS }),
  clear: () => set({ unlockedUntil: null }),
}));

// True while the unlock window is open.
export function isParentUnlocked(nowWall = Date.now()): boolean {
  const until = useParentStore.getState().unlockedUntil;
  return until !== null && until > nowWall;
}
