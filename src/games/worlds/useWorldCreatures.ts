// Loads a world's creatures (on screen + album) for the active kid and lets the kid bring album creatures back.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getArtwork } from '@/db/repositories/artworkRepo';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { listEntities } from '@/db/repositories/worldRepo';
import { fileUri } from '@/services/files';
import { useSessionStore } from '@/state/sessionStore';

import { bringBack, splitOnScreen } from './album';
import { spriteParams } from './spriteParams';
import type { Creature } from './types';
import type { PlayWorld } from './worldConfig';

const onScreenKey = (kidId: string, world: string) => `world_onscreen_${kidId}_${world}`;

// Parses the saved on-screen id list.
function parseIds(v: string | null): string[] | null {
  try {
    const a: unknown = v ? JSON.parse(v) : null;
    return Array.isArray(a) && a.every((x) => typeof x === 'string') ? a : null;
  } catch {
    return null;
  }
}

// Creatures for a world.
export function useWorldCreatures(world: PlayWorld, max: number) {
  const kidId = useSessionStore((s) => s.activeKidId);
  const [onScreen, setOnScreen] = useState<Creature[]>([]);
  const [album, setAlbum] = useState<Creature[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!kidId) return;
    const entities = await listEntities(kidId, world);
    const creatures: Creature[] = [];
    for (const e of entities) {
      const art = await getArtwork(e.artworkId);
      if (art && !art.trashedAt) creatures.push({ entity: e, uri: `${fileUri(art.pngPath)}?v=${art.updatedAt}`, params: spriteParams(e.id) });
    }
    const flat = creatures.map((c) => ({ id: c.entity.id, createdAt: c.entity.createdAt, c }));
    const split = splitOnScreen(flat, max, parseIds(await getMeta(onScreenKey(kidId, world))));
    setOnScreen(split.onScreen.map((x) => x.c));
    setAlbum(split.album.map((x) => x.c));
    setTotal(creatures.length);
  }, [kidId, world, max]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e: unknown) => console.warn('[world] load failed', e));
    }, [load]),
  );

  // Brings an album creature back on screen.
  const restore = useCallback(
    async (id: string) => {
      if (!kidId) return;
      const ids = bringBack(
        onScreen.map((c) => ({ id: c.entity.id, createdAt: c.entity.createdAt })),
        id,
        max,
      );
      await setMeta(onScreenKey(kidId, world), JSON.stringify(ids));
      await load();
    },
    [kidId, onScreen, max, world, load],
  );

  return { onScreen, album, total, restore, reload: load };
}
