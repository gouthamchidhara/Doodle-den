// Music Paint notes (A5): each palette color plays one pentatonic marimba note.
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { getMasterVolume } from '@/services/audio';
import type { PaletteKey } from '@/types/models';

export type Note = 'C4' | 'D4' | 'E4' | 'G4' | 'A4' | 'C5' | 'D5' | 'E5' | 'G5' | 'A5';

export const COLOR_NOTE: Record<PaletteKey, Note> = {
  tomato: 'C4',
  orange: 'D4',
  sun: 'E4',
  leaf: 'G4',
  sky: 'A4',
  grape: 'C5',
  pink: 'D5',
  brown: 'E5',
  black: 'G5',
  white: 'A5',
};

const FILES: Record<Note, number> = {
  C4: require('../../../assets/sounds/notes/C4.m4a'),
  D4: require('../../../assets/sounds/notes/D4.m4a'),
  E4: require('../../../assets/sounds/notes/E4.m4a'),
  G4: require('../../../assets/sounds/notes/G4.m4a'),
  A4: require('../../../assets/sounds/notes/A4.m4a'),
  C5: require('../../../assets/sounds/notes/C5.m4a'),
  D5: require('../../../assets/sounds/notes/D5.m4a'),
  E5: require('../../../assets/sounds/notes/E5.m4a'),
  G5: require('../../../assets/sounds/notes/G5.m4a'),
  A5: require('../../../assets/sounds/notes/A5.m4a'),
};

// Note for a stroke color (custom colors and rainbow fall back to the closest-feeling default, C4).
export function noteForColor(color: string): Note {
  return color in COLOR_NOTE ? COLOR_NOTE[color as PaletteKey] : 'C4';
}

const players = new Map<Note, AudioPlayer>();

// Plays a note (volume 0..1, scaled by the parent master volume).
export function playNote(note: Note, volume: number): void {
  try {
    let p = players.get(note);
    if (!p) {
      p = createAudioPlayer(FILES[note]);
      players.set(note, p);
    }
    p.volume = Math.max(0, Math.min(1, volume)) * getMasterVolume();
    p.seekTo(0).catch(() => undefined);
    p.play();
  } catch (e) {
    console.warn('[music] note failed', e);
  }
}
