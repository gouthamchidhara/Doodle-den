// Canvas session state: current tool choices and the registry of open drawings that must save on lock AUTOSAVE.
import { create } from 'zustand';

import type { BrushType } from '@/types/models';

export type Saver = () => Promise<void>;

interface CanvasState {
  tool: BrushType;
  color: string;
  size: 'S' | 'M' | 'L';
  stampId: string;
  savers: Saver[];
  setTool: (t: BrushType) => void;
  setColor: (c: string) => void;
  setSize: (s: 'S' | 'M' | 'L') => void;
  setStamp: (id: string) => void;
  register: (s: Saver) => () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  tool: 'crayon',
  color: 'tomato',
  size: 'M',
  stampId: 'heart',
  savers: [],
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  setStamp: (stampId) => set({ stampId, tool: 'stamp' }),
  register: (s) => {
    set({ savers: [...get().savers, s] });
    return () => set({ savers: get().savers.filter((x) => x !== s) });
  },
}));

// Saves every open drawing (lock AUTOSAVE, app background). Never throws.
export async function saveAllOpenDrawings(): Promise<void> {
  for (const s of useCanvasStore.getState().savers) {
    try {
      await s();
    } catch (e) {
      console.warn('[canvas] autosave failed', e);
    }
  }
}
