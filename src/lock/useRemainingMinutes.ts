// Minutes of play left for the time pill, from the running lock state (A4 getRemaining); the pill rounds up.
import { useLockStore } from './lockStore';

// Minutes left as a fraction (null until the lock state is loaded).
export function useRemainingMinutes(): number | null {
  const sec = useLockStore((s) => s.remainingSec);
  return sec === null ? null : sec / 60;
}
