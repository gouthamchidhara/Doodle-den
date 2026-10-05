// Blank mint screen shown while startup state loads, then redirects.
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { getDb } from '@/db/database';
import { decideStartRoute, loadStartupState } from '@/services/startup';
import { useSessionStore } from '@/state/sessionStore';
import { colors } from '@/theme/tokens';

import { startupLockCheck } from './startupLockCheck';

// Opens the DB, reads startup state, sets the active kid and replaces itself with the right route.
export function StartupScreen() {
  const setActiveKid = useSessionStore((s) => s.setActiveKid);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getDb();
        const state = await loadStartupState(startupLockCheck);
        if (cancelled) return;
        if (state.activeKid) setActiveKid(state.activeKid.id, state.activeKid.ageMode);
        router.replace(decideStartRoute(state));
      } catch (error) {
        console.warn('[startup] failed, going to onboarding', error);
        if (!cancelled) router.replace('/onboarding/welcome');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setActiveKid]);
  return <View style={{ flex: 1, backgroundColor: colors.bgKid }} />;
}
