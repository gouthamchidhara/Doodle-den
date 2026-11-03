// Museum Night (A5): pick 3–6 drawings, the show timeline (~45 s), "Surprise me". Pure.
export const MIN_PICK = 3;
export const MAX_PICK = 6;
export const MAX_PARADE = 5;
export const SPOT_MS = 5000; // each frame lights up and replays
export const PARADE_MS = 8000;
export const APPLAUSE_MS = 6000;

export interface Pickable {
  id: string;
  isFavorite: boolean;
  createdAt: number;
}

// Favorites first, then newest.
export function pickOrder<T extends Pickable>(arts: T[]): T[] {
  return [...arts].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.createdAt - a.createdAt);
}

// "Surprise me": favorites, then newest, up to 6.
export function surprise<T extends Pickable>(arts: T[]): string[] {
  return pickOrder(arts).slice(0, MAX_PICK).map((a) => a.id);
}

// Toggles a pick (max 6).
export function togglePick(picked: string[], id: string): string[] {
  if (picked.includes(id)) return picked.filter((x) => x !== id);
  return picked.length >= MAX_PICK ? picked : [...picked, id];
}

export type ShowStep = { kind: 'spot'; index: number } | { kind: 'parade' } | { kind: 'applause' } | { kind: 'end' };

// Which part of the show is playing `t` ms in, for n frames.
export function showStep(t: number, n: number): ShowStep {
  const spots = n * SPOT_MS;
  if (t < spots) return { kind: 'spot', index: Math.floor(t / SPOT_MS) };
  if (t < spots + PARADE_MS) return { kind: 'parade' };
  if (t < spots + PARADE_MS + APPLAUSE_MS) return { kind: 'applause' };
  return { kind: 'end' };
}

// Total show length (6 drawings ≈ 44 s).
export function showLength(n: number): number {
  return n * SPOT_MS + PARADE_MS + APPLAUSE_MS;
}
