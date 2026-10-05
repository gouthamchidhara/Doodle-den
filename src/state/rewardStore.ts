// Queue of earned stickers waiting to be shown as toasts (max one toast per 20 s).
import { create } from 'zustand';

export const TOAST_GAP_MS = 20_000;

interface RewardQueue {
  queue: string[];
  lastShownAt: number | null;
  push: (ids: string[]) => void;
  shift: (now: number) => string | null;
}

// Milliseconds to wait before the next toast may show.
export function nextToastDelay(lastShownAt: number | null, now: number): number {
  return lastShownAt === null ? 0 : Math.max(0, lastShownAt + TOAST_GAP_MS - now);
}

export const useRewardStore = create<RewardQueue>((set, get) => ({
  queue: [],
  lastShownAt: null,
  push: (ids) => {
    if (ids.length > 0) set({ queue: [...get().queue, ...ids] });
  },
  shift: (now) => {
    const { queue, lastShownAt } = get();
    if (queue.length === 0 || nextToastDelay(lastShownAt, now) > 0) return null;
    set({ queue: queue.slice(1), lastShownAt: now });
    return queue[0];
  },
}));
