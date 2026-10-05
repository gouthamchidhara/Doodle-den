// Puts a saved drawing into a world: inserts the world_entity row and checks world rewards.
import { saveEntity } from '@/db/repositories/worldRepo';
import { checkRewards } from '@/games/rewards/rewardEngine';
import type { WorldKey } from '@/types/feature';
import { newId } from '@/utils/ids';

import names from '@/content/creatureNames.json';

export const CREATURE_NAMES: string[] = names;
export const MAX_CREATURE_NAME = 12;

// A random friendly name (Little mode).
export function randomCreatureName(rand: () => number = Math.random): string {
  return CREATURE_NAMES[Math.floor(rand() * CREATURE_NAMES.length)] ?? 'Sunny';
}

// Adds the creature and returns its entity id.
export async function addCreature(kidId: string, world: WorldKey, artworkId: string, name: string | null, opts: { fromPaper?: boolean } = {}): Promise<string> {
  const id = newId();
  await saveEntity({ id, kidId, world, artworkId, name: name ? name.slice(0, MAX_CREATURE_NAME) : null, voiceClipId: null, createdAt: Date.now() });
  await checkRewards(kidId, 'WORLD_ENTITY_ADDED', { world, fromPaper: opts.fromPaper });
  return id;
}
