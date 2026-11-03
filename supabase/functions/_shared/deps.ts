// Data access the guard and usage logging need, behind an interface so Deno tests can fake it.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import type { Feature } from './contract.ts';

export interface Family {
  id: string;
  ai_entitled: boolean;
}

export interface GuardDeps {
  userIdFromToken(token: string): Promise<string | null>;
  familyForUser(userId: string): Promise<Family | null>;
  hasConsent(familyId: string): Promise<boolean>;
  config<T>(key: string): Promise<T | null>;
  countUsage(familyId: string, feature: Feature, sinceIso: string): Promise<number>;
  logUsage(familyId: string, feature: Feature, status: 'ok' | 'blocked' | 'error' | 'cap', costUsd: number): Promise<void>;
}

// Service-role client (server only).
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
}

// Real implementation on Supabase.
export function supabaseDeps(sb: SupabaseClient = serviceClient()): GuardDeps {
  return {
    async userIdFromToken(token) {
      const { data } = await sb.auth.getUser(token);
      return data.user?.id ?? null;
    },
    async familyForUser(userId) {
      const { data } = await sb.from('family').select('id, ai_entitled').eq('parent_user_id', userId).maybeSingle();
      return data ?? null;
    },
    async hasConsent(familyId) {
      const { data } = await sb.from('ai_consent').select('family_id').eq('family_id', familyId).is('revoked_at', null).maybeSingle();
      return !!data;
    },
    async config(key) {
      const { data } = await sb.from('app_config').select('value').eq('key', key).maybeSingle();
      return (data?.value ?? null) as never;
    },
    async countUsage(familyId, feature, sinceIso) {
      const { count } = await sb.from('ai_usage').select('id', { count: 'exact', head: true }).eq('family_id', familyId).eq('feature', feature).in('status', ['ok', 'blocked']).gte('created_at', sinceIso);
      return count ?? 0;
    },
    async logUsage(familyId, feature, status, costUsd) {
      await sb.from('ai_usage').insert({ family_id: familyId, feature, status, est_cost_usd: costUsd });
    },
  };
}
