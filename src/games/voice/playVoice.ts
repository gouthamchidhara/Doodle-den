// Plays a saved creature voice clip with its preset (A5 Drawings That Talk). Local files only.
import { getClip } from '@/db/repositories/voiceRepo';
import { playClip } from '@/services/audio';
import { fileUri } from '@/services/files';
import type { VoicePreset } from '@/types/feature';

export const PRESET_RATE: Record<VoicePreset, number> = { normal: 1, chipmunk: 1.6, monster: 0.7 };

// Plays a clip by id (no-op when missing).
export async function playVoiceClip(clipId: string): Promise<void> {
  const clip = await getClip(clipId);
  if (!clip) return;
  playClip(fileUri(clip.path), { rate: PRESET_RATE[clip.preset] });
}
