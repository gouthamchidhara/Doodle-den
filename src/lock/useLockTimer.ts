// Runs the lock engine every second while the app is active (A4 Hook useLockTimer).
import { useSegments } from 'expo-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useSessionStore } from '@/state/sessionStore';

import { activityForSegments } from './activityForRoute';
import { SERVER_SYNC_EVERY_MS, TICK_INTERVAL_MS } from './constants';
import { lockController } from './lockRuntime';
import { loadServerOffset, syncServerTime } from './serverTime';

// Starts/stops the controller for the active kid and drives ticks, saves and server-time sync.
export function useLockTimer(): void {
  const kidId = useSessionStore((s) => s.activeKidId);
  const segments = useSegments();
  const route = useRef<readonly string[]>(segments);
  useLayoutEffect(() => {
    route.current = segments;
  });

  useEffect(() => {
    loadServerOffset()
      .then(() => syncServerTime())
      .catch(() => undefined);
    const t = setInterval(() => void syncServerTime(), SERVER_SYNC_EVERY_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!kidId) return undefined;
    let timer: ReturnType<typeof setInterval> | null = null;
    const step = () => {
      const segs = route.current;
      void lockController.step(segs[0] === '(kid)', activityForSegments(segs));
    };
    const startTimer = () => {
      if (timer === null) timer = setInterval(step, TICK_INTERVAL_MS);
    };
    const stopTimer = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    lockController
      .start(kidId)
      .then(() => {
        if (AppState.currentState === 'active') startTimer();
      })
      .catch((e: unknown) => console.warn('[lock] start failed', e));
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        step();
        startTimer();
      } else {
        stopTimer();
        void lockController.flush();
      }
    });
    return () => {
      stopTimer();
      sub.remove();
    };
  }, [kidId]);
}
