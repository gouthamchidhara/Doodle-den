// Drawings placed into Draw-to-Life worlds (A3 world_entity).
import type { WorldEntity, WorldKey } from '@/types/feature';

import { getDb } from '../database';

interface Row {
  id: string;
  kid_id: string;
  world: WorldKey;
  artwork_id: string;
  name: string | null;
  voice_clip_id: string | null;
  created_at: number;
}

const toEntity = (r: Row): WorldEntity => ({
  id: r.id,
  kidId: r.kid_id,
  world: r.world,
  artworkId: r.artwork_id,
  name: r.name,
  voiceClipId: r.voice_clip_id,
  createdAt: r.created_at,
});

// Lists a kid's creatures in one world, newest first.
export async function listEntities(kidId: string, world: WorldKey): Promise<WorldEntity[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM world_entity WHERE kid_id = ? AND world = ? ORDER BY created_at DESC', [kidId, world])).map(toEntity);
}

// Lists a kid's creatures in every world, newest first.
export async function listAllEntities(kidId: string): Promise<WorldEntity[]> {
  const db = await getDb();
  return (await db.all<Row>('SELECT * FROM world_entity WHERE kid_id = ? ORDER BY created_at DESC', [kidId])).map(toEntity);
}

// Gets one creature.
export async function getEntity(id: string): Promise<WorldEntity | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM world_entity WHERE id = ?', [id]);
  return r ? toEntity(r) : null;
}

// Finds the creature made from an artwork in any world.
export async function getEntityByArtwork(artworkId: string): Promise<WorldEntity | null> {
  const db = await getDb();
  const r = await db.get<Row>('SELECT * FROM world_entity WHERE artwork_id = ? ORDER BY created_at DESC LIMIT 1', [artworkId]);
  return r ? toEntity(r) : null;
}

// Inserts or updates a creature.
export async function saveEntity(e: WorldEntity): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO world_entity (id, kid_id, world, artwork_id, name, voice_clip_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, voice_clip_id = excluded.voice_clip_id`,
    [e.id, e.kidId, e.world, e.artworkId, e.name, e.voiceClipId, e.createdAt],
  );
}

// Deletes a creature (only parents remove drawings; worlds never delete).
export async function deleteEntity(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM world_entity WHERE id = ?', [id]);
}
