// Mounted once in the root layout: runs the lock timer and keeps a locked kid on /locked (A4 LockGate rules).
import { router, useSegments } from 'expo-router';
import { useEffect, useLayoutEffect, useRef } from 'react';

import { saveAllOpenDrawings } from '@/state/canvasStore';

import { lockController } from './lockRuntime';
import { useLockStore } from './lockStore';
import { applyScreenTimeMonitoring, removeShield, shieldNow } from './screenTime';
import { useLockTimer } from './useLockTimer';

// Route groups a locked kid may still see.
export function isAllowedWhileLocked(segments: readonly string[]): boolean {
  const first = segments[0];
  return first === undefined || first === 'locked' || first === 'parent' || first === 'onboarding' || first === 'profiles';
}

// Renders nothing.
export function LockGate() {
  useLockTimer();
  const segments = useSegments();
  const reason = useLockStore((s) => s.state?.lock.reason ?? 'none');
  const route = useRef<readonly string[]>(segments);
  useLayoutEffect(() => {
    route.current = segments;
  });

  useEffect(() => {
    lockController.setEffects({
      autosave: saveAllOpenDrawings,
      goLocked: () => {
        if (route.current[0] !== 'locked' && route.current[0] !== 'parent') router.replace('/locked');
      },
      goHome: () => {
        if (route.current[0] === 'locked') router.replace('/home');
      },
      shield: {
        lock: shieldNow,
        unlock: removeShield,
        reapply: (rules, extra) => void applyScreenTimeMonitoring(rules, extra),
      },
    });
  }, []);

  useEffect(() => {
    if (reason !== 'none' && !isAllowedWhileLocked(segments)) router.replace('/locked');
  }, [reason, segments]);

  return null;
}
