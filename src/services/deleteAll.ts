// "Delete all data" (A5 Account, store requirement): server account (rows, storage, auth user) then everything local.
import { getDb } from '@/db/database';
import { listKids } from '@/db/repositories/kidRepo';
import { lockController } from '@/lock/lockRuntime';
import { clearLockState } from '@/lock/lockStorage';
import { useSessionStore } from '@/state/sessionStore';

import { deleteKidArt } from './files';
import { clearPin } from './pinService';
import { getSupabase } from './supabase';

const TABLES = ['sync_queue', 'ai_result', 'story', 'museum_exhibit', 'jigsaw_result', 'music_paint', 'flipbook', 'world_entity', 'voice_clip', 'custom_color', 'reward_earned', 'progress', 'artwork', 'usage_day', 'time_rule', 'kid_profile', 'app_meta'];

// Deletes the Supabase account (if signed in) and all local data. Returns false if the server delete failed.
export async function deleteAllData(): Promise<boolean> {
  const sb = getSupabase();
  const session = sb ? (await sb.auth.getSession()).data.session : null;
  if (sb && session) {
    const { error } = await sb.functions.invoke('delete-account', { body: {} });
    if (error) {
      console.warn('[deleteAll] server delete failed', error.message);
      return false;
    }
    await sb.auth.signOut().catch(() => undefined);
  }
  await lockController.stop().catch(() => undefined);
  const kids = await listKids();
  for (const k of kids) {
    deleteKidArt(k.id);
    await clearLockState(k.id);
  }
  const db = await getDb();
  await db.transaction(async () => {
    for (const t of TABLES) await db.run(`DELETE FROM ${t}`).catch(() => undefined);
  });
  await clearPin();
  useSessionStore.getState().setActiveKid(null, 'big');
  return true;
}
