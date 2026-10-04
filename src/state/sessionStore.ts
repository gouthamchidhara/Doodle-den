// Session state shared app-wide: the active kid and their age mode.
import { create } from 'zustand';

import type { AgeMode } from '@/types/models';

export interface SessionState {
  activeKidId: string | null;
  ageMode: AgeMode;
  setActiveKid: (kidId: string | null, ageMode: AgeMode) => void;
}

// Global session store; ageMode defaults to 'big' until a kid profile is chosen.
export const useSessionStore = create<SessionState>((set) => ({
  activeKidId: null,
  ageMode: 'big',
  setActiveKid: (activeKidId, ageMode) => set({ activeKidId, ageMode }),
}));
