// Parent account (A3, T-071): email magic link, persisted session, family row on first sign-in, RevenueCat logIn.
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';

import { getMeta, setMeta } from '@/db/repositories/metaRepo';

import { logInPurchases } from './purchases';
import { getSupabase } from './supabase';

export const FAMILY_KEY = 'family_id';

// Where the magic link sends the parent back (doodleden://auth).
export function authRedirect(reset = false): string {
  return Linking.createURL('auth', { queryParams: reset ? { reset: 'pin' } : {} });
}

// Sends a sign-in link; returns false when Supabase is not configured or the call failed.
export async function sendMagicLink(email: string, reset = false): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: authRedirect(reset), shouldCreateUser: !reset } });
  if (error) console.warn('[auth] magic link failed', error.message);
  return !error;
}

// Finishes sign-in from the link (PKCE code or implicit tokens). Returns true when signed in.
export async function completeSignIn(params: { code?: string; access_token?: string; refresh_token?: string }): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    if (params.code) {
      const { error } = await sb.auth.exchangeCodeForSession(params.code);
      if (error) return false;
    } else if (params.access_token && params.refresh_token) {
      const { error } = await sb.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
      if (error) return false;
    } else return false;
    const familyId = await ensureFamily();
    if (familyId) await logInPurchases(familyId);
    return true;
  } catch (e) {
    console.warn('[auth] sign-in failed', e);
    return false;
  }
}

// Returns the family id, creating the family row on first sign-in.
export async function ensureFamily(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const found = await sb.from('family').select('id').eq('parent_user_id', u.user.id).maybeSingle();
  let id: string | null = found.data?.id ?? null;
  if (!id) {
    const made = await sb.from('family').insert({ parent_user_id: u.user.id }).select('id').single();
    id = made.data?.id ?? null;
  }
  if (id) await setMeta(FAMILY_KEY, id);
  return id;
}

// Cached family id (null when never signed in).
export async function familyId(): Promise<string | null> {
  return getMeta(FAMILY_KEY);
}

// Current access token, or null when signed out.
export async function accessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

// Signs out (local data stays).
export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

// Signed-in email (null when signed out); updates on auth changes.
export function useAuth(): { email: string | null; ready: boolean } {
  const [state, setState] = useState<{ email: string | null; ready: boolean }>({ email: null, ready: false });
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setTimeout(() => setState({ email: null, ready: true }), 0);
      return undefined;
    }
    sb.auth
      .getSession()
      .then(({ data }) => setState({ email: data.session?.user.email ?? null, ready: true }))
      .catch(() => setState({ email: null, ready: true }));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setState({ email: session?.user.email ?? null, ready: true }));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}
