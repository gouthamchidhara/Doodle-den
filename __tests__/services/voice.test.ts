// voice.ts fallback rules + voiceLines coverage (T-010).
import * as Speech from 'expo-speech';

import coachIdeas from '@/content/coachIdeas.json';
import dailyIdeas from '@/content/dailyIdeas.json';
import offScreenIdeas from '@/content/offScreenIdeas.json';
import voiceLines from '@/content/voiceLines.json';
import { playClip } from '@/services/audio';
import { say, voiceText } from '@/services/voice';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));
jest.mock('@/services/audio', () => ({ playClip: jest.fn() }));
jest.mock('@/content/voiceFiles', () => ({ voiceFiles: { mascot_hi: 42 } }));

beforeEach(() => jest.clearAllMocks());

describe('voice', () => {
  it("say('intro_draw') speaks via expo-speech when no file exists", () => {
    say('intro_draw');
    expect(Speech.speak).toHaveBeenCalledWith("Let's draw anything you like!", { rate: 0.9, pitch: 1.1 });
    expect(playClip).not.toHaveBeenCalled();
  });
  it('plays the recorded file when it exists', () => {
    say('mascot_hi');
    expect(playClip).toHaveBeenCalledWith(42);
    expect(Speech.speak).not.toHaveBeenCalled();
  });
  it('ignores unknown keys', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    say('nope');
    expect(Speech.speak).not.toHaveBeenCalled();
    warn.mockRestore();
  });
  it('voiceLines covers every key family from A5/A7', () => {
    const keys = Object.keys(voiceLines);
    expect(keys.filter((k) => k.startsWith('intro_')).length).toBeGreaterThanOrEqual(22);
    for (const k of ['mascot_beautiful', 'mascot_sleepy', 'mascot_break', 'mascot_sleeping', 'mascot_full_colors', 'mascot_no_drawing_seen', 'mascot_ask_grownup', 'ai_ask_grownup', 'ai_nap', 'ai_blocked', 'ai_tangled', 'ai_offline']) {
      expect(voiceText(k)).toBeTruthy();
    }
    for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(voiceText(`letter_${l}`)).toContain(l);
    for (let n = 0; n <= 9; n += 1) expect(voiceText(`number_${n}`)).toBeTruthy();
    for (const s of ['circle', 'square', 'triangle', 'star', 'heart', 'line', 'zigzag', 'spiral']) expect(voiceText(`shape_${s}`)).toBeTruthy();
    expect(coachIdeas).toHaveLength(40);
    expect(coachIdeas[0]).toEqual({ id: 'add_sun', text: 'Add a big sun!', voice: 'coach_add_sun' });
    for (const c of coachIdeas) expect(voiceText(c.voice)).toBe(c.text);
    expect(dailyIdeas).toHaveLength(30);
    for (const d of dailyIdeas) expect(voiceText(d.voice)).toBe(d.text);
    expect(offScreenIdeas).toHaveLength(12);
    for (const o of offScreenIdeas) expect(voiceText(o.voice)).toBeTruthy();
  });
});
