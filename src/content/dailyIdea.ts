// Picks "Today's idea" by local day, rotating through the 30 ideas.
import dailyIdeas from './dailyIdeas.json';

export interface DailyIdea {
  id: number;
  text: string;
  activity: string;
  voice: string;
}

// Day number since 1970 for a 'YYYY-MM-DD' key.
function dayNumber(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

// The idea for a local day.
export function pickDailyIdea(dayKey: string): DailyIdea {
  const list: DailyIdea[] = dailyIdeas;
  return list[((dayNumber(dayKey) % list.length) + list.length) % list.length];
}
