// T-055: hold to record, pick a voice, keep it → clip file in the kid's folder, row saved, linked to the creature.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';
import { router } from 'expo-router';

import { setDbForTesting } from '@/db/database';
import { saveArtwork } from '@/db/repositories/artworkRepo';
import { createKid } from '@/db/repositories/kidRepo';
import { listClips } from '@/db/repositories/voiceRepo';
import { getEntity, saveEntity } from '@/db/repositories/worldRepo';
import { voiceForArtwork } from '@/games/voice/voiceStore';
import { VoiceSheet } from '@/games/voice/VoiceSheet';

import { fsData } from '../helpers/mockFs';
import { createTestDb } from '../helpers/nodeDb';

let mockN = 0;
jest.mock('@/utils/ids', () => ({ newId: () => `id-${++mockN}` }));

async function setup() {
  setDbForTesting(await createTestDb());
  const kid = await createKid({ nickname: 'Vo', avatarId: 'fox', ageMode: 'big' });
  await saveArtwork({ id: 'art', kidId: kid.id, activity: 'world', title: null, pngPath: 'p', thumbPath: 't', strokesPath: null, durationSec: 0, createdAt: 1, updatedAt: 1, isFavorite: false, isSticker: false, trashedAt: null });
  await saveEntity({ id: 'ent', kidId: kid.id, world: 'zoo', artworkId: 'art', name: 'Pip', voiceClipId: null, createdAt: 1 });
  return kid.id;
}

describe('VoiceSheet', () => {
  it('without the mic permission, sends a grown-up through the gate', async () => {
    const kidId = await setup();
    jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ granted: false } as never);
    await render(<VoiceSheet kidId={kidId} target={{ entityId: 'ent' }} returnTo="/zoo" onClose={jest.fn()} />);
    await fireEvent.press(await screen.findByLabelText('Grown-ups'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/parent/gate', params: { next: '/zoo?granted=1' } });
  });

  it('records, previews a preset and keeps the clip on the device', async () => {
    const kidId = await setup();
    jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ granted: true } as never);
    fsData.set('file:///cache/rec.m4a', 'audio');
    const rec = { prepareToRecordAsync: jest.fn(async () => undefined), record: jest.fn(), stop: jest.fn(async () => undefined), uri: 'file:///cache/rec.m4a' };
    jest.mocked(useAudioRecorder).mockReturnValue(rec as never);
    const onClose = jest.fn();
    await render(<VoiceSheet kidId={kidId} target={{ entityId: 'ent' }} returnTo="/zoo" onClose={onClose} />);
    const mic = await screen.findByLabelText('Hold to record');
    await fireEvent(mic, 'pressIn');
    await waitFor(() => expect(rec.record).toHaveBeenCalled());
    await fireEvent(mic, 'pressOut');
    await fireEvent.press(await screen.findByLabelText('Chipmunk'));
    await fireEvent.press(screen.getByLabelText('Keep it!'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [clip] = await listClips(kidId);
    expect(clip.preset).toBe('chipmunk');
    expect(clip.path).toBe(`art/${kidId}/voice/${clip.id}.m4a`);
    expect(fsData.has('file:///cache/rec.m4a')).toBe(false);
    expect(fsData.has(`file:///doc/${clip.path}`)).toBe(true);
    expect((await getEntity('ent'))?.voiceClipId).toBe(clip.id);
    expect(await voiceForArtwork('art')).toBe(clip.id);
  });
});
