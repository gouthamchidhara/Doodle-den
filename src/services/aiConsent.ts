// AI consent (A7 Consent screen): versioned, stored locally and in ai_consent; revoking sets revoked_at.
import { setMeta } from '@/db/repositories/metaRepo';

import { CONSENT_KEY } from './ai';
import { ensureFamily } from './auth';
import { getSupabase } from './supabase';

export const CONSENT_VERSION = 1;
export const NICKNAME_KEY = 'ai_use_nickname';

// Turns Magic on (needs a signed-in parent). Returns false when it could not be stored online.
export async function giveAiConsent(): Promise<boolean> {
  const sb = getSupabase();
  const familyId = sb ? await ensureFamily() : null;
  if (!sb || !familyId) return false;
  const { error } = await sb.from('ai_consent').upsert({ family_id: familyId, consent_version: CONSENT_VERSION, consented_at: new Date().toISOString(), revoked_at: null });
  if (error) return false;
  await setMeta(CONSENT_KEY, '1');
  return true;
}

// Turns Magic off (local first, then online).
export async function revokeAiConsent(): Promise<void> {
  await setMeta(CONSENT_KEY, '0');
  const sb = getSupabase();
  const familyId = sb ? await ensureFamily() : null;
  if (sb && familyId) await sb.from('ai_consent').update({ revoked_at: new Date().toISOString() }).eq('family_id', familyId);
}
