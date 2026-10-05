// Off-screen play ideas for the lock screen: 3 at a time, rotating through the 12 in offScreenIdeas.json.
import ideas from './offScreenIdeas.json';

export interface OffScreenIdea {
  id: number;
  text: string;
  icon: string;
  voice: string;
}

export const OFF_SCREEN_IDEAS: OffScreenIdea[] = ideas;

// Three ideas starting at a rotating position (seed = any integer, e.g. hours since epoch).
export function pickOffScreenIdeas(seed: number, count = 3): OffScreenIdea[] {
  const n = OFF_SCREEN_IDEAS.length;
  const start = (((Math.floor(seed) * count) % n) + n) % n;
  return Array.from({ length: count }, (_, i) => OFF_SCREEN_IDEAS[(start + i) % n]);
}
