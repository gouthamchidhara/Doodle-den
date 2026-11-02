// Saves a recorded voice clip (A5 Drawings That Talk): file art/<kidId>/voice/<id>.m4a + voice_clip row + link. Never uploaded.
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { saveClip } from '@/db/repositories/voiceRepo';
import { getEntity, getEntityByArtwork, saveEntity } from '@/db/repositories/worldRepo';
import { moveIntoApp } from '@/services/files';
import type { VoicePreset } from '@/types/feature';
import { newId } from '@/utils/ids';

export const MAX_RECORD_MS = 10_000;

export type VoiceTarget = { entityId: string } | { artworkId: string };

// Meta key for a gallery drawing's voice when it is not in a world.
export const artVoiceKey = (artworkId: string) => `voice_art_${artworkId}`;

// Moves the recording into the kid's folder, stores the clip and links it. Returns the clip id.
export async function keepVoice(kidId: string, recordingUri: string, preset: VoicePreset, durationMs: number, target: VoiceTarget): Promise<string> {
  const id = newId();
  const path = `art/${kidId}/voice/${id}.m4a`;
  await moveIntoApp(recordingUri, path);
  await saveClip({ id, kidId, path, preset, durationMs: Math.min(durationMs, MAX_RECORD_MS), createdAt: Date.now() });
  const entity = 'entityId' in target ? await getEntity(target.entityId) : await getEntityByArtwork(target.artworkId);
  if (entity) await saveEntity({ ...entity, voiceClipId: id });
  if ('artworkId' in target) await setMeta(artVoiceKey(target.artworkId), id);
  return id;
}

// Voice clip id for a gallery drawing (its world creature's, or its own).
export async function voiceForArtwork(artworkId: string): Promise<string | null> {
  return (await getEntityByArtwork(artworkId))?.voiceClipId ?? (await getMeta(artVoiceKey(artworkId)));
}
