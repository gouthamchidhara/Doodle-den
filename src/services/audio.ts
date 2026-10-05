// Sound effects (A2 Sounds): preload once, play by name, loop the lullaby. Never throws.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';

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
  | 'lullaby-loop'
  | 'clap'
  | 'giggle'
  | 'cheer'
  | 'splash'
  | 'vroom'
  | 'hop'
  | 'click'
  | 'wiggle'
  | 'magic-loop'
  | 'beep';

const SOURCES: Record<SoundName, number> = {
  tap: require('../../assets/sounds/tap.m4a'),
  'tool-select': require('../../assets/sounds/tool-select.m4a'),
  'color-pick': require('../../assets/sounds/color-pick.m4a'),
  undo: require('../../assets/sounds/undo.m4a'),
  'save-sparkle': require('../../assets/sounds/save-sparkle.m4a'),
  yawn: require('../../assets/sounds/yawn.m4a'),
  bubble: require('../../assets/sounds/bubble.m4a'),
  'new-color': require('../../assets/sounds/new-color.m4a'),
  star: require('../../assets/sounds/star.m4a'),
  'sticker-earned': require('../../assets/sounds/sticker-earned.m4a'),
  'lullaby-loop': require('../../assets/sounds/lullaby-loop.m4a'),
  clap: require('../../assets/sounds/clap.m4a'),
  giggle: require('../../assets/sounds/giggle.m4a'),
  cheer: require('../../assets/sounds/cheer.m4a'),
  splash: require('../../assets/sounds/splash.m4a'),
  vroom: require('../../assets/sounds/vroom.m4a'),
  hop: require('../../assets/sounds/hop.m4a'),
  click: require('../../assets/sounds/click.m4a'),
  wiggle: require('../../assets/sounds/wiggle.m4a'),
  'magic-loop': require('../../assets/sounds/magic-loop.m4a'),
  beep: require('../../assets/sounds/beep.m4a'),
};

const players = new Map<SoundName, AudioPlayer>();
let masterVolume = 1;
let modeSet = false;

// Sets the audio session once so sounds play even in silent mode.
async function ensureMode(): Promise<void> {
  if (modeSet) return;
  modeSet = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch (error) {
    console.warn('[audio] setAudioMode failed', error);
  }
}

// Returns (creating once) the cached player for a sound.
function playerFor(name: SoundName): AudioPlayer | null {
  try {
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players.set(name, p);
    }
    return p;
  } catch (error) {
    console.warn('[audio] create player failed', name, error);
    return null;
  }
}

// Creates players for every sound so the first tap has no delay.
export async function preloadSounds(): Promise<void> {
  await ensureMode();
  (Object.keys(SOURCES) as SoundName[]).forEach((n) => playerFor(n));
}

// Parent volume (0..1) applied to every sound and voice clip.
export function setMasterVolume(v: number): void {
  masterVolume = Math.min(1, Math.max(0, v));
}

// Current parent volume.
export function getMasterVolume(): number {
  return masterVolume;
}

// Plays a short sound effect from the start; never throws.
export function playSound(name: SoundName, volume = 1): void {
  void ensureMode();
  const p = playerFor(name);
  if (!p) return;
  try {
    p.volume = volume * masterVolume;
    p.loop = false;
    p.seekTo(0).catch(() => undefined);
    p.play();
  } catch (error) {
    console.warn('[audio] play failed', name, error);
  }
}

// Starts a looping sound and returns a function that stops it.
export function loopSound(name: SoundName, volume = 1): () => void {
  void ensureMode();
  const p = playerFor(name);
  if (!p) return () => undefined;
  try {
    p.volume = volume * masterVolume;
    p.loop = true;
    p.seekTo(0).catch(() => undefined);
    p.play();
  } catch (error) {
    console.warn('[audio] loop failed', name, error);
  }
  return () => {
    try {
      p.pause();
      p.loop = false;
    } catch (error) {
      console.warn('[audio] stop failed', name, error);
    }
  };
}

export interface ClipOptions {
  volume?: number;
  rate?: number;
}

// Plays any audio source once (voice files, recordings, notes); returns the player so callers can release it.
export function playClip(source: AudioSource | number | string, opts: ClipOptions = {}): AudioPlayer | null {
  void ensureMode();
  try {
    const p = createAudioPlayer(source);
    p.volume = (opts.volume ?? 1) * masterVolume;
    if (opts.rate && opts.rate !== 1) {
      p.shouldCorrectPitch = false;
      p.setPlaybackRate(opts.rate);
    }
    p.play();
    return p;
  } catch (error) {
    console.warn('[audio] clip failed', error);
    return null;
  }
}
