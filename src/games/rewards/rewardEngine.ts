// Reward engine (A5): after a creative event, grant every reward it has earned (grantReward is a no-op when owned).
import { TRACE_PATHS } from '@/content/tracePaths';
import type { RewardEvent } from '@/content/rewards';
import { countArtworks } from '@/db/repositories/artworkRepo';
import { listCustomColors } from '@/db/repositories/colorRepo';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { getProgress } from '@/db/repositories/progressRepo';
import { grantReward } from '@/db/repositories/rewardRepo';
import { listEntities } from '@/db/repositories/worldRepo';
import { useRewardStore } from '@/state/rewardStore';
import type { WorldKey } from '@/types/feature';
import { localDayKey } from '@/utils/time';

export interface RewardContext {
  world?: WorldKey;
  fromPaper?: boolean;
  traceId?: string;
  pieces?: number;
  lessonId?: string;
  now?: number;
}

const WORLD_FIRST: Partial<Record<WorldKey, string>> = { aquarium: 'first_fish', racetrack: 'first_car', zoo: 'first_animal' };

// Reward ids a count has reached.
const reached = (n: number, steps: [number, string][]) => steps.filter(([min]) => n >= min).map(([, id]) => id);

// True when every trace item of a kind has progress.
async function allTraced(kidId: string, kind: 'letter' | 'number' | 'shape'): Promise<boolean> {
  const done = new Set((await getProgress(kidId)).map((p) => p.skill));
  return TRACE_PATHS.filter((p) => p.kind === kind && (kind !== 'letter' || p.id === p.id.toUpperCase())).every((p) => done.has(`trace_${p.id}`));
}

// Candidate reward ids for an event.
export async function candidates(kidId: string, event: RewardEvent, ctx: RewardContext = {}): Promise<string[]> {
  switch (event) {
    case 'ARTWORK_SAVED': {
      const n = await countArtworks(kidId);
      return [...reached(n, [[1, 'first_drawing'], [5, 'five_drawings'], [20, 'twenty_drawings'], [50, 'fifty_drawings']]), `day_${localDayKey(ctx.now ?? Date.now())}`];
    }
    case 'WORLD_ENTITY_ADDED': {
      const out: string[] = [];
      const first = ctx.world ? WORLD_FIRST[ctx.world] : undefined;
      if (first) out.push(first);
      if (ctx.world === 'aquarium' && (await listEntities(kidId, 'aquarium')).length >= 10) out.push('aquarium_ten');
      if (ctx.fromPaper) out.push('first_paper');
      return out;
    }
    case 'TRACE_COMPLETED': {
      const id = ctx.traceId ?? '';
      const p = TRACE_PATHS.find((t) => t.id === id);
      const out: string[] = [];
      if (p?.kind === 'letter') out.push(`letter_${id.toUpperCase()}`);
      if (p?.kind === 'letter' && (await allTraced(kidId, 'letter'))) out.push('all_letters');
      if (p?.kind === 'number' && (await allTraced(kidId, 'number'))) out.push('all_numbers');
      if (p?.kind === 'shape' && (await allTraced(kidId, 'shape'))) out.push('all_shapes');
      return out;
    }
    case 'COLOR_NAMED':
      return reached((await listCustomColors(kidId)).length, [[1, 'first_color'], [3, 'three_colors'], [10, 'ten_colors']]);
    case 'FLIPBOOK_SAVED':
      return ['first_flipbook'];
    case 'MUSIC_SAVED':
      return ['first_song'];
    case 'RAMPS_BUCKET': {
      const key = `ramps_buckets_${kidId}`;
      const n = Number((await getMeta(key)) ?? 0) + 1;
      await setMeta(key, String(n));
      return reached(n, [[1, 'bucket_one'], [10, 'bucket_ten']]);
    }
    case 'JIGSAW_DONE':
      return ctx.pieces ? [`jigsaw_${ctx.pieces}`] : [];
    case 'STORY_MADE':
      return ['first_story'];
    case 'MAGIC_DONE':
      return ['first_magic'];
    case 'GUESS_YES':
      return ['mascot_friend'];
    case 'MUSEUM_OPENED':
      return ['museum_night'];
    case 'GUIDED_DONE':
      return ctx.lessonId ? [`guided_${ctx.lessonId}`] : [];
    default:
      return [];
  }
}

// Grants earned rewards for an event, queues toasts, and returns the newly earned ids. Never throws.
export async function checkRewards(kidId: string, event: RewardEvent, ctx: RewardContext = {}): Promise<string[]> {
  try {
    const fresh: string[] = [];
    for (const id of await candidates(kidId, event, ctx)) if (await grantReward(kidId, id)) fresh.push(id);
    useRewardStore.getState().push(fresh);
    return fresh;
  } catch (e) {
    console.warn('[rewards] check failed', e);
    return [];
  }
}
