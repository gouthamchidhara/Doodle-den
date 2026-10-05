// Reward catalog (A5 Sticker Book & rewards): 56 stickers (10 also unlock a bonus stamp) + 30 rotating daily designs.
import data from './rewards.json';

export type RewardEvent =
  | 'ARTWORK_SAVED'
  | 'WORLD_ENTITY_ADDED'
  | 'TRACE_COMPLETED'
  | 'COLOR_NAMED'
  | 'FLIPBOOK_SAVED'
  | 'MUSIC_SAVED'
  | 'RAMPS_BUCKET'
  | 'JIGSAW_DONE'
  | 'STORY_MADE'
  | 'MAGIC_DONE'
  | 'GUESS_YES'
  | 'MUSEUM_OPENED'
  | 'GUIDED_DONE';

export interface RewardDef {
  id: string;
  title: string;
  event: string;
  bonusStamp?: string;
}

export const REWARDS: RewardDef[] = data.rewards;
export const DAILY_DESIGNS: { design: number; title: string }[] = data.daily;

// Reward by id (daily ids 'day_YYYY-MM-DD' get a generated entry).
export function getReward(id: string): RewardDef | undefined {
  if (id.startsWith('day_')) return { id, title: dailyTitle(id), event: 'ARTWORK_SAVED' };
  return REWARDS.find((r) => r.id === id);
}

// Which of the 30 daily designs a date uses (day of year mod 30).
export function dailyDesign(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  const day = Math.floor((Date.UTC(y, m - 1, d) - start) / 86_400_000);
  return day % DAILY_DESIGNS.length;
}

// Title for a daily sticker id.
export function dailyTitle(id: string): string {
  return DAILY_DESIGNS[dailyDesign(id.slice(4))]?.title ?? 'Happy day';
}
