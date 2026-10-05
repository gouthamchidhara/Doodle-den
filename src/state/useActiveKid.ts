// Loads the active kid profile from the session store id.
import { useEffect, useState } from 'react';

import { getKid } from '@/db/repositories/kidRepo';
import { useSessionStore } from '@/state/sessionStore';
import type { KidProfile } from '@/types/models';

// Returns the active kid (null while loading or when none is chosen).
export function useActiveKid(): KidProfile | null {
  const id = useSessionStore((s) => s.activeKidId);
  const [loaded, setLoaded] = useState<{ id: string; kid: KidProfile | null } | null>(null);
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    getKid(id)
      .then((kid) => {
        if (alive) setLoaded({ id, kid });
      })
      .catch((e: unknown) => console.warn('[useActiveKid] load failed', e));
    return () => {
      alive = false;
    };
  }, [id]);
  return id && loaded?.id === id ? loaded.kid : null;
}
