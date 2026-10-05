// Guards every parent route except the gate; checks the 5-minute window every few seconds.
import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

import { isParentUnlocked, useParentStore } from '@/state/parentStore';
import { colors } from '@/theme/tokens';

const CHECK_MS = 5000;

// Parent stack with the unlock guard.
export function ParentZoneLayout() {
  const pathname = usePathname();
  const unlockedUntil = useParentStore((s) => s.unlockedUntil);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), CHECK_MS);
    return () => clearInterval(t);
  }, []);
  useEffect(() => () => useParentStore.getState().clear(), []);

  const onGate = pathname === '/parent/gate';
  if (!onGate && !(unlockedUntil !== null && unlockedUntil > now) && !isParentUnlocked()) {
    return <Redirect href={{ pathname: '/parent/gate', params: { next: pathname } }} />;
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgParent } }} />;
}
