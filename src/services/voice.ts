// Voice prompts (A5): play assets/voice/<key>.m4a when recorded, else speak voiceLines.json text.
import * as Speech from 'expo-speech';

import { voiceFiles } from '@/content/voiceFiles';
import voiceLines from '@/content/voiceLines.json';

import { playClip } from './audio';

const LINES: Record<string, string> = voiceLines;
export const SPEECH_RATE = 0.9;
export const SPEECH_PITCH = 1.1;

// Text for a voice key (undefined when unknown).
export function voiceText(key: string): string | undefined {
  return LINES[key];
}

// Speaks arbitrary text with the app voice settings; never throws.
export function sayText(text: string, rate = SPEECH_RATE): void {
  try {
    Speech.stop().catch(() => undefined);
    Speech.speak(text, { rate, pitch: SPEECH_PITCH });
  } catch (error) {
    console.warn('[voice] speak failed', error);
  }
}

// Plays or speaks the line for a key; unknown keys are ignored.
export function say(key: string): void {
  const file = voiceFiles[key];
  if (file !== undefined) {
    playClip(file);
    return;
  }
  const text = LINES[key];
  if (text) sayText(text);
  else console.warn('[voice] unknown key', key);
}

// Stops any speech in progress.
export function stopVoice(): void {
  Speech.stop().catch(() => undefined);
}
