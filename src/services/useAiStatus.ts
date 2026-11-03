// Magic (AI) availability for dimming / padlocking tiles (A7): online, consented, signed in.
import { useEffect, useState } from 'react';

import { getMeta } from '@/db/repositories/metaRepo';

import { CONSENT_KEY, isOnline } from './ai';
import { useAuth } from './auth';

export interface AiStatus {
  online: boolean;
  consented: boolean;
  signedIn: boolean;
}

const RECHECK_MS = 60_000;

// Live status (re-checked every minute).
export function useAiStatus(): AiStatus {
  const { email } = useAuth();
  const [online, setOnline] = useState(true);
  const [consentFlag, setConsentFlag] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = () => {
      isOnline()
        .then((o) => alive && setOnline(o))
        .catch(() => undefined);
      getMeta(CONSENT_KEY)
        .then((v) => alive && setConsentFlag(v === '1'))
        .catch(() => undefined);
    };
    check();
    const t = setInterval(check, RECHECK_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const signedIn = !!email;
  return { online, consented: consentFlag && signedIn, signedIn };
}
