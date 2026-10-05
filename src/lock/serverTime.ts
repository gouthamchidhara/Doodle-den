// Server time offset (A4 Clock rules): server_now() RPC on launch and every 10 min; stored in app_meta.
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { getSupabase } from '@/services/supabase';

export const SERVER_OFFSET_KEY = 'server_offset_ms';

let cached: number | null = null;

// Last known offset (serverNow - Date.now()), or null if never synced.
export function getServerOffset(): number | null {
  return cached;
}

// Loads the stored offset into memory (call at startup before the first tick).
export async function loadServerOffset(): Promise<number | null> {
  try {
    const v = await getMeta(SERVER_OFFSET_KEY);
    cached = v !== null && Number.isFinite(Number(v)) ? Number(v) : null;
  } catch (e) {
    console.warn('[serverTime] load failed', e);
  }
  return cached;
}

// Asks Supabase for the time and stores the offset; returns it, or null when offline / not configured.
export async function syncServerTime(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const sentAt = Date.now();
    const { data, error } = await sb.rpc('server_now');
    if (error || typeof data !== 'string') return null;
    const receivedAt = Date.now();
    const offset = Date.parse(data) - (sentAt + receivedAt) / 2;
    if (!Number.isFinite(offset)) return null;
    cached = Math.round(offset);
    await setMeta(SERVER_OFFSET_KEY, String(cached));
    return cached;
  } catch (e) {
    console.warn('[serverTime] sync failed', e);
    return null;
  }
}

// Test hook.
export function setServerOffsetForTesting(v: number | null): void {
  cached = v;
}
