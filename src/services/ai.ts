// App client for AI Magic (A7): online + consent checks, one call per feature, error code → mascot line.
import { getMeta } from '@/db/repositories/metaRepo';

import { getSupabase } from './supabase';

export type AiCode = 'NEEDS_CONSENT' | 'NEEDS_PLAN' | 'CAP_REACHED' | 'BLOCKED' | 'BAD_INPUT' | 'PROVIDER_ERROR' | 'UNAUTHORIZED';
export type AiFailure = AiCode | 'OFFLINE' | 'TIMEOUT';
export type AiResult<T> = { ok: true; id: string; data: T } | { ok: false; code: AiFailure };

export const AI_TIMEOUT_MS = 60_000;
export const HEALTH_TIMEOUT_MS = 3_000;
export const CONSENT_KEY = 'ai_consent';

export interface MascotLine {
  text: string;
  voice: string;
  then: 'gate' | 'back' | 'picker' | 'retry';
}

// Kid-facing line for a failure (never shows the code).
export function mascotLineFor(code: AiFailure): MascotLine {
  switch (code) {
    case 'NEEDS_CONSENT':
    case 'NEEDS_PLAN':
    case 'UNAUTHORIZED':
      return { text: 'Ask a grown-up to turn on Magic!', voice: 'ai_ask_grownup', then: 'gate' };
    case 'CAP_REACHED':
      return { text: "My magic needs a nap. Let's try again tomorrow!", voice: 'ai_nap', then: 'back' };
    case 'BLOCKED':
      return { text: "Hmm, let's pick a different idea!", voice: 'ai_blocked', then: 'picker' };
    case 'OFFLINE':
      return { text: 'Magic needs the internet.', voice: 'ai_offline', then: 'back' };
    default:
      return { text: 'Oops, my magic got tangled. Try again?', voice: 'ai_tangled', then: 'retry' };
  }
}

// Quick reachability check of Supabase (3 s); NetInfo is not allowed.
export async function isOnline(): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/auth/v1/health`, { signal: ctl.signal, headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '' } });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// True when the parent accepted the AI consent on this device.
export async function hasAiConsent(): Promise<boolean> {
  return (await getMeta(CONSENT_KEY)) === '1';
}

// Calls one edge function with the parent's token (attached by supabase-js) and a 60 s timeout.
export async function callAi<T>(fn: string, body: Record<string, unknown>): Promise<AiResult<T>> {
  const sb = getSupabase();
  if (!sb) return { ok: false, code: 'UNAUTHORIZED' };
  if (!(await hasAiConsent())) return { ok: false, code: 'NEEDS_CONSENT' };
  if (!(await isOnline())) return { ok: false, code: 'OFFLINE' };
  if (!(await sb.auth.getSession()).data.session) return { ok: false, code: 'UNAUTHORIZED' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AiResult<T>>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, code: 'TIMEOUT' }), AI_TIMEOUT_MS);
  });
  const call = (async (): Promise<AiResult<T>> => {
    const { data, error } = await sb.functions.invoke(fn, { body });
    if (error || !data) return { ok: false, code: 'PROVIDER_ERROR' };
    return data as AiResult<T>;
  })().catch((): AiResult<T> => ({ ok: false, code: 'PROVIDER_ERROR' }));
  const out = await Promise.race([call, timeout]);
  if (timer) clearTimeout(timer);
  return out;
}

export type AgeMode = 'little' | 'big';

// Feature 1.
export function makeColoringPage(body: { ageMode: AgeMode; tiles?: { who: string; doing?: string; where?: string }; spokenText?: string }) {
  return callAi<{ imageBase64: string; idea: string }>('ai-coloring-page', body);
}
// Feature 2.
export function magicSketch(body: { ageMode: AgeMode; imageBase64: string }) {
  return callAi<{ imageBase64: string }>('ai-magic-sketch', body);
}
// Feature 3.
export function makeStory(body: { ageMode: AgeMode; images: string[]; heroName?: string }) {
  return callAi<{ title: string; pages: { artIndex: number; text: string }[] }>('ai-story', body);
}
// Feature 4.
export function guessDrawing(body: { ageMode: AgeMode; imageBase64: string }) {
  return callAi<{ guesses: string[] }>('ai-guess', body);
}
// Feature 5.
export function getCoachIdea(body: { ageMode: AgeMode; imageBase64: string }) {
  return callAi<{ id: string }>('ai-coach', body);
}
// Feature 6.
export function getDigest(body: { week: Record<string, unknown> }) {
  return callAi<{ text: string }>('ai-digest', body);
}
