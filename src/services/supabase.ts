// Supabase client for the parent account, sync and server time. Null when the project keys are not set.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CHUNK = 1800;

// Secure-store session storage, split into chunks (secure-store values should stay under 2 KB).
export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i += 1) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${key}.n`, String(n));
  },
  async removeItem(key: string): Promise<void> {
    const count = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? 0);
    for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

let client: SupabaseClient | null | undefined;

// Shared client, created on first use; null when EXPO_PUBLIC_SUPABASE_URL / ANON_KEY are missing.
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { storage: secureSessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
  return client;
}

// Test hook: replace (or clear) the client.
export function setSupabaseForTesting(c: SupabaseClient | null | undefined): void {
  client = c;
}
