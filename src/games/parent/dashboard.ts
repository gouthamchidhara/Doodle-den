// Parent dashboard data (A5): today, the week, rule summary, new art, skills line, digest facts. Pure helpers + loader.
import { listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { listCustomColors } from '@/db/repositories/colorRepo';
import { getProgress } from '@/db/repositories/progressRepo';
import { getRules } from '@/db/repositories/rulesRepo';
import { listStories } from '@/db/repositories/storyRepo';
import { getWeek } from '@/db/repositories/usageRepo';
import type { TimeRules, UsageDay } from '@/types/models';
import { formatClock, localDayKey } from '@/utils/time';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface Dashboard {
  rules: TimeRules;
  week: UsageDay[];
  today: UsageDay;
  newArt: ArtworkRecord[];
  newArtCount: number;
  letters: string[];
  colors: number;
  stories: number;
}

// Letters the kid has traced, in order (uppercase).
export function tracedLetters(skills: string[]): string[] {
  return [...new Set(skills.filter((s) => /^trace_[A-Za-z]$/.test(s)).map((s) => s.slice(6).toUpperCase()))].sort();
}

// "Skills: traced letters A–F · discovered 9 colors"
export function skillsLine(letters: string[], colors: number): string {
  const parts: string[] = [];
  if (letters.length === 1) parts.push(`traced letter ${letters[0]}`);
  else if (letters.length > 1) {
    const run = letters.every((l, i) => i === 0 || l.charCodeAt(0) === letters[i - 1].charCodeAt(0) + 1);
    parts.push(`traced letters ${run ? `${letters[0]}–${letters[letters.length - 1]}` : letters.join(', ')}`);
  }
  if (colors > 0) parts.push(`discovered ${colors} color${colors === 1 ? '' : 's'}`);
  return parts.length ? `Skills: ${parts.join(' · ')}` : 'Skills: just getting started';
}

// Week bars (oldest first) with day letters.
export function weekBars(week: UsageDay[], todayKey: string): { label: string; minutes: number; isToday: boolean }[] {
  return week.map((d) => {
    const [y, m, dd] = d.dayKey.split('-').map(Number);
    return { label: DAY_LETTERS[new Date(y, m - 1, dd).getDay()], minutes: Math.round(d.usedSec / 60), isToday: d.dayKey === todayKey };
  });
}

// "7:30 PM – 7:00 AM" or "Off".
export function bedtimeText(r: TimeRules): string {
  return r.bedtimeEnabled ? `${formatClock(r.bedtimeStart)} – ${formatClock(r.bedtimeEnd)}` : 'Off';
}

// Everything for one kid.
export async function loadDashboard(kidId: string, now = Date.now()): Promise<Dashboard> {
  const todayKey = localDayKey(now);
  const [rules, week, arts, progress, colors, stories] = await Promise.all([
    getRules(kidId),
    getWeek(kidId, todayKey),
    listArtworks(kidId, { excludeActivities: ['flipbook_frame'] }),
    getProgress(kidId),
    listCustomColors(kidId),
    listStories(kidId),
  ]);
  const weekAgo = now - 7 * 86_400_000;
  const recent = arts.filter((a) => a.createdAt >= weekAgo);
  return {
    rules,
    week,
    today: week[week.length - 1],
    newArt: recent.slice(0, 3),
    newArtCount: recent.length,
    letters: tracedLetters(progress.map((p) => p.skill)),
    colors: colors.length,
    stories: stories.length,
  };
}

// Numbers-only facts for the AI digest (A7 Feature 6).
export function digestFacts(d: Dashboard): Record<string, unknown> {
  const activities: Record<string, number> = {};
  for (const day of d.week) for (const [k, v] of Object.entries(day.perActivitySec)) activities[k] = (activities[k] ?? 0) + Math.round((v ?? 0) / 60);
  return {
    minutesPerDay: d.week.map((x) => Math.round(x.usedSec / 60)),
    dailyLimitMin: d.rules.dailyLimitMin,
    activities,
    artworkCount: d.newArtCount,
    newColorsNamed: d.colors,
    lettersTraced: d.letters,
    storiesMade: d.stories,
  };
}
