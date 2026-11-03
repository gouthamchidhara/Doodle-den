// Family Gallery app side (A7): private link create/revoke, per-artwork share toggle (uploads even if backup is off).
import * as Crypto from 'expo-crypto';

import { getArtwork, setFamilyShared } from '@/db/repositories/artworkRepo';
import { ensureFamily } from '@/services/auth';
import { getSupabase } from '@/services/supabase';

import { pushRow } from './syncPush';

// 32 url-safe random chars.
export function newShareToken(bytes: Uint8Array = Crypto.getRandomBytes(24)): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Public page URL for a token.
export function galleryUrl(token: string): string {
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/functions/v1/family-gallery?t=${token}`;
}

// The active link's token, or null.
export async function activeShareToken(): Promise<string | null> {
  const sb = getSupabase();
  const fam = await ensureFamily();
  if (!sb || !fam) return null;
  const r = await sb.from('family_share').select('token').eq('family_id', fam).is('revoked_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return (r.data as { token: string } | null)?.token ?? null;
}

// Creates a new private link; returns its token.
export async function createShareLink(): Promise<string | null> {
  const sb = getSupabase();
  const fam = await ensureFamily();
  if (!sb || !fam) return null;
  const token = newShareToken();
  const r = await sb.from('family_share').insert({ family_id: fam, token });
  if (r.error) {
    console.warn('[familyGallery] create failed', r.error.message);
    return null;
  }
  return token;
}

// Turns off every active link for the family.
export async function revokeShareLinks(): Promise<void> {
  const sb = getSupabase();
  const fam = await ensureFamily();
  if (!sb || !fam) return;
  const r = await sb.from('family_share').update({ revoked_at: new Date().toISOString() }).eq('family_id', fam).is('revoked_at', null);
  if (r.error) console.warn('[familyGallery] revoke failed', r.error.message);
}

// Marks an artwork shared (or not) and pushes it right away (kid row first for the FK).
export async function shareArtwork(id: string, shared: boolean): Promise<void> {
  await setFamilyShared(id, shared);
  const sb = getSupabase();
  const fam = await ensureFamily();
  const a = await getArtwork(id);
  if (!sb || !fam || !a) return;
  try {
    await pushRow(sb, fam, { id: 0, table_name: 'kid_profile', row_key: a.kidId, op: 'upsert' });
    await pushRow(sb, fam, { id: 0, table_name: 'artwork', row_key: id, op: 'upsert' });
  } catch (e) {
    console.warn('[familyGallery] upload failed; sync will retry', e);
  }
}
