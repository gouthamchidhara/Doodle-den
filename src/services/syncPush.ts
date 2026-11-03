// Pushes one sync_queue row to Supabase (A3 Sync rules). PNG artwork only; never strokes, photos or voice clips.
import type { SupabaseClient } from '@supabase/supabase-js';

import { getArtwork } from '@/db/repositories/artworkRepo';
import { getKid } from '@/db/repositories/kidRepo';
import { getRules } from '@/db/repositories/rulesRepo';
import { getUsageDay } from '@/db/repositories/usageRepo';
import type { SyncTable } from '@/db/syncQueue';
import { readBase64 } from '@/services/files';
import type { UsageDay } from '@/types/models';

export interface QueueRow {
  id: number;
  table_name: SyncTable;
  row_key: string;
  op: 'upsert' | 'delete';
}

interface RemoteUsage {
  used_sec: number;
  sessions: number;
  extensions_used: number;
}

// usage_day conflict rule: MAX of each counter, so reinstalling never lowers used time.
export function mergeUsage(local: UsageDay, remote: RemoteUsage | null): RemoteUsage {
  if (!remote) return { used_sec: local.usedSec, sessions: local.sessions, extensions_used: local.extensionsUsed };
  return {
    used_sec: Math.max(local.usedSec, remote.used_sec),
    sessions: Math.max(local.sessions, remote.sessions),
    extensions_used: Math.max(local.extensionsUsed, remote.extensions_used),
  };
}

// Storage path of an artwork PNG: <family_id>/<kid_id>/<artwork_id>.png
export function artStoragePath(familyId: string, kidId: string, artworkId: string): string {
  return `${familyId}/${kidId}/${artworkId}.png`;
}

// base64 → bytes for storage upload.
export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function check(res: { error: { message: string } | null }): void {
  if (res.error) throw new Error(res.error.message);
}

// Pushes one row; throws on failure. A row deleted locally since queuing is skipped.
export async function pushRow(sb: SupabaseClient, familyId: string, row: QueueRow): Promise<void> {
  const iso = (ms: number) => new Date(ms).toISOString();
  if (row.table_name === 'kid_profile') {
    if (row.op === 'delete') return check(await sb.from('kid_profile').delete().eq('id', row.row_key));
    const k = await getKid(row.row_key);
    if (!k) return;
    return check(
      await sb.from('kid_profile').upsert({ id: k.id, family_id: familyId, nickname: k.nickname, avatar_id: k.avatarId, age_mode: k.ageMode, created_at: iso(k.createdAt) }),
    );
  }
  if (row.table_name === 'time_rule') {
    if (!(await getKid(row.row_key))) return;
    const { kidId, ...rules } = await getRules(row.row_key);
    return check(await sb.from('time_rule').upsert({ kid_id: kidId, rules, updated_at: new Date().toISOString() }));
  }
  if (row.table_name === 'usage_day') {
    const [kidId, dayKey] = row.row_key.split('|');
    if (!(await getKid(kidId))) return;
    const local = await getUsageDay(kidId, dayKey);
    const remote = await sb.from('usage_day').select('used_sec, sessions, extensions_used').eq('kid_id', kidId).eq('day_key', dayKey).maybeSingle();
    check(remote);
    const merged = mergeUsage(local, remote.data as RemoteUsage | null);
    return check(await sb.from('usage_day').upsert({ kid_id: kidId, day_key: dayKey, ...merged, per_activity: local.perActivitySec }));
  }
  // artwork
  if (row.op === 'delete') {
    const existing = await sb.from('artwork').select('storage_path').eq('id', row.row_key).maybeSingle();
    check(existing);
    const path = (existing.data as { storage_path: string } | null)?.storage_path;
    if (path) check(await sb.storage.from('art').remove([path]));
    return check(await sb.from('artwork').delete().eq('id', row.row_key));
  }
  const a = await getArtwork(row.row_key);
  if (!a || !(await getKid(a.kidId))) return;
  if (a.trashedAt !== null) return check(await sb.from('artwork').delete().eq('id', a.id));
  const path = artStoragePath(familyId, a.kidId, a.id);
  const b64 = await readBase64(a.pngPath);
  if (!b64) return;
  check(await sb.storage.from('art').upload(path, base64ToBytes(b64), { contentType: 'image/png', upsert: true }));
  return check(
    await sb.from('artwork').upsert({
      id: a.id,
      kid_id: a.kidId,
      activity: a.activity,
      title: a.title,
      storage_path: path,
      created_at: iso(a.createdAt),
      is_favorite: a.isFavorite,
      family_shared: a.familyShared,
    }),
  );
}
