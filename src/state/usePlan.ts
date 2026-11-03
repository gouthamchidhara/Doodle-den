// Current plan for gating: Family entitlement (cached) or open when the paywall is not configured.
import { useEffect, useState } from 'react';

import { cachedFamily } from '@/services/purchases';
import { paywallActive } from '@/state/features';

// { family: true } when Family is active or there is no paywall.
export function usePlan(): { family: boolean } {
  const [family, setFamily] = useState(true);
  useEffect(() => {
    if (!paywallActive()) return;
    cachedFamily()
      .then(setFamily)
      .catch(() => undefined);
  }, []);
  return { family };
}
