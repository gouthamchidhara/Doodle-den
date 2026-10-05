// First visit to an activity plays its intro voice once per kid (A5 global rules); returns a replay function.
import { useCallback, useEffect } from 'react';

import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { say } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';

// Meta key remembering that a kid heard an intro.
export const introSeenKey = (kidId: string, voiceKey: string) => `intro_seen_${kidId}_${voiceKey}`;

// Plays `voiceKey` on the first visit; the returned function replays it (speaker button).
export function useIntroVoice(voiceKey: string): () => void {
  const kidId = useSessionStore((s) => s.activeKidId);
  useEffect(() => {
    if (!kidId) return;
    const key = introSeenKey(kidId, voiceKey);
    getMeta(key)
      .then(async (seen) => {
        if (seen) return;
        say(voiceKey);
        await setMeta(key, '1');
      })
      .catch((e: unknown) => console.warn('[intro] failed', e));
  }, [kidId, voiceKey]);
  return useCallback(() => say(voiceKey), [voiceKey]);
}
