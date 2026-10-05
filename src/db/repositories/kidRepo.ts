// Kid profiles (A3). Nicknames only — never real names, birthdays or photos.
import { deleteKidArt } from '@/services/files';
import type { AgeMode, KidProfile } from '@/types/models';
import { newId } from '@/utils/ids';

import { getDb } from '../database';
import { enqueueSync } from '../syncQueue';

interface KidRow {
  id: string;
  nickname: string;
  avatar_id: string;
  age_mode: AgeMode;
  created_at: number;
}

export const MAX_KIDS = 4;
export const MAX_NICKNAME = 12;

const toKid = (r: KidRow): KidProfile => ({ id: r.id, nickname: r.nickname, avatarId: r.avatar_id, ageMode: r.age_mode, createdAt: r.created_at });

// Lists kid profiles, oldest first.
export async function listKids(): Promise<KidProfile[]> {
  const db = await getDb();
  return (await db.all<KidRow>('SELECT * FROM kid_profile ORDER BY created_at ASC')).map(toKid);
}

// Gets one kid profile.
export async function getKid(id: string): Promise<KidProfile | null> {
  const db = await getDb();
  const row = await db.get<KidRow>('SELECT * FROM kid_profile WHERE id = ?', [id]);
  return row ? toKid(row) : null;
}

// Creates a kid with a trimmed nickname (max 12 chars) and default time rules.
export async function createKid(input: { nickname: string; avatarId: string; ageMode: AgeMode }): Promise<KidProfile> {
  const db = await getDb();
  const kid: KidProfile = {
    id: newId(),
    nickname: input.nickname.trim().slice(0, MAX_NICKNAME),
    avatarId: input.avatarId,
    ageMode: input.ageMode,
    createdAt: Date.now(),
  };
  await db.transaction(async () => {
    await db.run('INSERT INTO kid_profile (id, nickname, avatar_id, age_mode, created_at) VALUES (?, ?, ?, ?, ?)', [
      kid.id,
      kid.nickname,
      kid.avatarId,
      kid.ageMode,
      kid.createdAt,
    ]);
    await db.run('INSERT INTO time_rule (kid_id) VALUES (?)', [kid.id]);
    await enqueueSync(db, 'kid_profile', kid.id, 'upsert');
    await enqueueSync(db, 'time_rule', kid.id, 'upsert');
  });
  return kid;
}

// Updates nickname, avatar or age mode.
export async function updateKid(id: string, patch: Partial<Pick<KidProfile, 'nickname' | 'avatarId' | 'ageMode'>>): Promise<KidProfile | null> {
  const db = await getDb();
  const current = await getKid(id);
  if (!current) return null;
  const next: KidProfile = {
    ...current,
    ...patch,
    nickname: (patch.nickname ?? current.nickname).trim().slice(0, MAX_NICKNAME),
  };
  await db.run('UPDATE kid_profile SET nickname = ?, avatar_id = ?, age_mode = ? WHERE id = ?', [next.nickname, next.avatarId, next.ageMode, id]);
  await enqueueSync(db, 'kid_profile', id, 'upsert');
  return next;
}

// Deletes a kid, (by cascade) all their rows, and their art folder.
export async function deleteKid(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM kid_profile WHERE id = ?', [id]);
  await enqueueSync(db, 'kid_profile', id, 'delete');
  deleteKidArt(id);
}
