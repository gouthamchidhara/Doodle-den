// Maps a kid route segment to the usage activity key (parent dashboard per-activity minutes).
import type { ActivityKey } from '@/types/models';

const MAP: Record<string, ActivityKey> = {
  draw: 'draw',
  coloring: 'coloring',
  guided: 'guided',
  kaleidoscope: 'kaleidoscope',
  flipbook: 'flipbook_frame',
  paper: 'paper',
  aquarium: 'world',
  racetrack: 'world',
  zoo: 'world',
  'world-draw': 'world',
  ramps: 'ramps',
  music: 'music',
  jigsaw: 'jigsaw',
  arwall: 'arwall',
  trace: 'trace',
  'mixing-lab': 'mixing',
  magic: 'magic',
  story: 'story',
  stories: 'story',
};

// Activity for segments like ['(kid)', 'draw']; null for home, gallery, stickers and non-kid routes.
export function activityForSegments(segments: readonly string[]): ActivityKey | null {
  if (segments[0] !== '(kid)') return null;
  return MAP[segments[1] ?? ''] ?? null;
}
