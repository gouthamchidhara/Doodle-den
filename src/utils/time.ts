// Local-time helpers: day keys, midnight, bedtime windows (A4). All take wall ms explicitly.

const pad = (n: number) => String(n).padStart(2, '0');

// Local calendar day 'YYYY-MM-DD' for a wall-clock time in the device time zone.
export function localDayKey(wallMs: number): string {
  const d = new Date(wallMs);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Moves a 'YYYY-MM-DD' key by a number of calendar days.
export function shiftDayKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

// Next local midnight strictly after wallMs.
export function nextLocalMidnight(wallMs: number): number {
  const d = new Date(wallMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
}

// Minutes since local midnight for 'HH:MM'.
export function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Minutes since local midnight for a wall-clock time.
function minutesOfDay(wallMs: number): number {
  const d = new Date(wallMs);
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

// True when wallMs falls inside the bedtime window; handles windows that cross midnight.
export function isInBedtime(wallMs: number, start: string, end: string): boolean {
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  const now = minutesOfDay(wallMs);
  if (s === e) return false;
  if (s > e) return now >= s || now < e;
  return now >= s && now < e;
}

// Next wall time (strictly after wallMs) when the local clock reads `end`.
export function nextBedtimeEnd(wallMs: number, end: string): number {
  const d = new Date(wallMs);
  const e = parseHHMM(end);
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(e / 60), e % 60, 0, 0).getTime();
  if (today > wallMs) return today;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, Math.floor(e / 60), e % 60, 0, 0).getTime();
}

// ISO week key 'YYYY-Www' for a wall time (local date).
export function isoWeekKey(wallMs: number): string {
  const local = new Date(wallMs);
  const d = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

// 'HH:MM' for minutes since midnight (wraps past 24 h).
export function toHHMM(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

// Friendly 12-hour label for 'HH:MM', e.g. '7:30 pm'.
export function formatClock(hhmm: string): string {
  const total = parseHHMM(hhmm);
  const h24 = Math.floor(total / 60);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${pad(total % 60)} ${h24 < 12 ? 'am' : 'pm'}`;
}
