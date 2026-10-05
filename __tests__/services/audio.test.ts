// audio.ts plays, loops and never throws (T-010).
import { createAudioPlayer } from 'expo-audio';

import { loopSound, playClip, playSound, preloadSounds, setMasterVolume } from '@/services/audio';

const mockPlayer = () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(() => Promise.resolve()), setPlaybackRate: jest.fn(), volume: 1, loop: false, shouldCorrectPitch: true });
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(() => mockPlayer()), setAudioModeAsync: jest.fn(() => Promise.resolve()) }));

describe('audio', () => {
  it('preloads, plays with master volume, loops and stops', async () => {
    await preloadSounds();
    expect((createAudioPlayer as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(11);
    setMasterVolume(0.5);
    playSound('tap');
    const results = (createAudioPlayer as jest.Mock).mock.results;
    const tap = results[0].value;
    expect(tap.play).toHaveBeenCalled();
    expect(tap.volume).toBe(0.5);
    const stop = loopSound('lullaby-loop', 0.3);
    stop();
    const clip = playClip(7, { rate: 1.6 });
    expect(clip?.setPlaybackRate).toHaveBeenCalledWith(1.6);
  });
  it('swallows player errors', () => {
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(playClip(1)).toBeNull();
    warn.mockRestore();
  });
});
