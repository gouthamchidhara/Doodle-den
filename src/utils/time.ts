// Date helpers for local day keys ('YYYY-MM-DD'). Bedtime/midnight helpers are added in T-009.

// Moves a 'YYYY-MM-DD' key by a number of calendar days.
export function shiftDayKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
