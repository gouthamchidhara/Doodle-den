// The three Draw-to-Life worlds (A5): names, max on screen, sounds and the creature template outline.
import type { SoundName } from '@/services/audio';
import type { WorldKey } from '@/types/feature';

export type PlayWorld = Exclude<WorldKey, 'arwall'>;

export interface WorldConfig {
  key: PlayWorld;
  title: string;
  noun: string;
  nounPlural: string;
  max: number;
  sound: SoundName;
  template: string; // normalized 0..1 SVG outline shown as the ghost
  route: '/aquarium' | '/racetrack' | '/zoo';
}

export const WORLDS: Record<PlayWorld, WorldConfig> = {
  aquarium: {
    key: 'aquarium',
    title: 'Aquarium',
    noun: 'fish',
    nounPlural: 'fish',
    max: 20,
    sound: 'splash',
    template: 'M0.15 0.5C0.3 0.25 0.6 0.25 0.72 0.5C0.6 0.75 0.3 0.75 0.15 0.5ZM0.72 0.5L0.88 0.36L0.88 0.64Z',
    route: '/aquarium',
  },
  racetrack: {
    key: 'racetrack',
    title: 'Racetrack',
    noun: 'car',
    nounPlural: 'cars',
    max: 8,
    sound: 'vroom',
    template: 'M0.1 0.62L0.1 0.48L0.28 0.46L0.38 0.32L0.64 0.32L0.74 0.46L0.9 0.48L0.9 0.62ZM0.22 0.66A0.08 0.08 0 1 0 0.38 0.66A0.08 0.08 0 1 0 0.22 0.66ZM0.62 0.66A0.08 0.08 0 1 0 0.78 0.66A0.08 0.08 0 1 0 0.62 0.66Z',
    route: '/racetrack',
  },
  zoo: {
    key: 'zoo',
    title: 'Zoo',
    noun: 'animal',
    nounPlural: 'animals',
    max: 16,
    sound: 'hop',
    template: 'M0.25 0.45C0.25 0.3 0.6 0.3 0.65 0.45L0.65 0.62L0.25 0.62ZM0.65 0.42A0.1 0.1 0 1 0 0.85 0.42A0.1 0.1 0 1 0 0.65 0.42ZM0.3 0.62L0.3 0.78M0.4 0.62L0.4 0.78M0.52 0.62L0.52 0.78M0.6 0.62L0.6 0.78',
    route: '/zoo',
  },
};

// Config for a route param (defaults to the aquarium).
export function worldFor(param: string | undefined): WorldConfig {
  return param === 'racetrack' || param === 'zoo' ? WORLDS[param] : WORLDS.aquarium;
}

// "Mia's Aquarium · 6 fish"
export function worldTitle(cfg: WorldConfig, nickname: string | undefined, count: number): string {
  const who = nickname ? `${nickname}'s ${cfg.title}` : cfg.title;
  return `${who} · ${count} ${count === 1 ? cfg.noun : cfg.nounPlural}`;
}
