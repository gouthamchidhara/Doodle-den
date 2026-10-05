// Minutes of play left for the time pill. Reads the lock store once T-033 wires it; until then shows the daily limit.
import { useEffect, useState } from 'react';

import { getRules } from '@/db/repositories/rulesRepo';
import { useSessionStore } from '@/state/sessionStore';

// Whole minutes left today (null while loading).
export function useRemainingMinutes(): number | null {
  const kidId = useSessionStore((s) => s.activeKidId);
  const [minutes, setMinutes] = useState<number | null>(null);
  useEffect(() => {
    if (!kidId) return;
    getRules(kidId)
      .then((r) => setMinutes(Math.min(r.dailyLimitMin, r.sessionLimitMin)))
      .catch(() => undefined);
  }, [kidId]);
  return minutes;
}
