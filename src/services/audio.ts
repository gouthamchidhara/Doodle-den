// Sound effect playback (A2 Sounds). Full preload/playback lands in T-010.
export type SoundName =
  | 'tap'
  | 'tool-select'
  | 'color-pick'
  | 'undo'
  | 'save-sparkle'
  | 'yawn'
  | 'bubble'
  | 'new-color'
  | 'star'
  | 'sticker-earned'
  | 'lullaby-loop';

// Plays a short sound effect; never throws.
export function playSound(name: SoundName): void {
  void name;
}
