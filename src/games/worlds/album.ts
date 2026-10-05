// Which creatures are on screen vs. in the Album (A5): newest up to max by default; bringing one back swaps out the oldest on screen.
export interface Dated {
  id: string;
  createdAt: number;
}

// Splits entities into on-screen and album, honoring a saved on-screen list when present.
export function splitOnScreen<T extends Dated>(all: T[], max: number, saved: string[] | null): { onScreen: T[]; album: T[] } {
  const byNew = [...all].sort((a, b) => b.createdAt - a.createdAt);
  let ids: string[];
  if (saved) {
    const known = new Set(all.map((e) => e.id));
    const kept = saved.filter((id) => known.has(id));
    const newer = byNew.filter((e) => !saved.includes(e.id) && e.createdAt > Math.max(0, ...all.filter((x) => kept.includes(x.id)).map((x) => x.createdAt)));
    ids = [...newer.map((e) => e.id), ...kept].slice(0, max);
  } else ids = byNew.slice(0, max).map((e) => e.id);
  const set = new Set(ids);
  return { onScreen: byNew.filter((e) => set.has(e.id)), album: byNew.filter((e) => !set.has(e.id)) };
}

// New on-screen id list after bringing `id` back from the album (the oldest on screen leaves when full).
export function bringBack<T extends Dated>(onScreen: T[], id: string, max: number): string[] {
  const ids = onScreen.map((e) => e.id);
  if (ids.includes(id)) return ids;
  if (ids.length < max) return [id, ...ids];
  const oldest = [...onScreen].sort((a, b) => a.createdAt - b.createdAt)[0];
  return [id, ...ids.filter((x) => x !== oldest.id)];
}
