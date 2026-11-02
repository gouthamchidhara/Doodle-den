// Drawings That Talk sheet (A5): hold the red mic to record (max 10 s, soft beep), try 3 voices, "Keep it!".
import { getRecordingPermissionsAsync, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MicIcon } from '@/components/kid/icons/MicIcon';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { playClip, playSound } from '@/services/audio';
import { border, colors, fonts, fontSize, overlays, radius, space } from '@/theme/tokens';
import type { VoicePreset } from '@/types/feature';

import { PRESET_RATE } from './playVoice';
import { keepVoice, MAX_RECORD_MS, type VoiceTarget } from './voiceStore';

export interface VoiceSheetProps {
  kidId: string;
  target: VoiceTarget;
  returnTo: string; // route to come back to after the Parent Gate grants the mic
  onClose: () => void;
  onSaved?: (clipId: string) => void;
}

const PRESETS: { key: VoicePreset; label: string }[] = [
  { key: 'normal', label: 'Normal' },
  { key: 'chipmunk', label: 'Chipmunk' },
  { key: 'monster', label: 'Monster' },
];

// The sheet.
export function VoiceSheet({ kidId, target, returnTo, onClose, onSaved }: VoiceSheetProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<{ uri: string; ms: number } | null>(null);
  const [preset, setPreset] = useState<VoicePreset>('normal');
  const started = useRef(0);
  const active = useRef(false);
  const held = useRef(false);
  const auto = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getRecordingPermissionsAsync()
      .then((p) => setAllowed(p.granted))
      .catch(() => setAllowed(false));
    return () => {
      if (auto.current) clearTimeout(auto.current);
    };
  }, []);

  const stop = async (beep: boolean) => {
    held.current = false;
    if (auto.current) clearTimeout(auto.current);
    auto.current = null;
    if (!active.current) return;
    active.current = false;
    setRecording(false);
    await recorder.stop();
    if (beep) playSound('beep');
    if (recorder.uri) setClip({ uri: recorder.uri, ms: Date.now() - started.current });
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  };

  const start = async () => {
    held.current = true;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!held.current) return;
      recorder.record();
      active.current = true;
      started.current = Date.now();
      setClip(null);
      setRecording(true);
      auto.current = setTimeout(() => void stop(true), MAX_RECORD_MS);
    } catch (e) {
      console.warn('[voice] record failed', e);
    }
  };

  const keep = async () => {
    if (!clip) return;
    const id = await keepVoice(kidId, clip.uri, preset, clip.ms, target);
    playSound('save-sparkle');
    onSaved?.(id);
    onClose();
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.scrim]}>
      <View style={styles.sheet}>
        {allowed === false ? (
          <>
            <SpeechBubble text="Ask a grown-up to let me use the microphone." voiceClip="mascot_ask_mic" />
            <PrimaryButton label="Grown-ups" onPress={() => router.push({ pathname: '/parent/gate', params: { next: `${returnTo}${returnTo.includes('?') ? '&' : '?'}granted=1` } })} />
          </>
        ) : (
          <>
            <Text style={styles.title}>{recording ? 'Talking…' : clip ? 'Pick a voice!' : 'Hold to talk'}</Text>
            <PressableScale
              accessibilityLabel="Hold to record"
              onPressIn={() => void start()}
              onPressOut={() => void stop(false)}
              style={[styles.mic, recording && styles.micOn]}
            >
              <MicIcon size={56} color={colors.white} />
            </PressableScale>
            {clip ? (
              <View style={styles.row}>
                {PRESETS.map((p) => (
                  <PressableScale
                    key={p.key}
                    accessibilityLabel={p.label}
                    selected={preset === p.key}
                    onPress={() => {
                      setPreset(p.key);
                      playClip(clip.uri, { rate: PRESET_RATE[p.key] });
                    }}
                    style={[styles.preset, preset === p.key ? styles.on : styles.off]}
                  >
                    <Text style={styles.presetText}>{p.label}</Text>
                  </PressableScale>
                ))}
              </View>
            ) : null}
            <View style={styles.row}>
              <PrimaryButton label="Keep it!" disabled={!clip} onPress={() => void keep()} />
            </View>
          </>
        )}
        <PrimaryButton label="Close" tone="tomato" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: overlays.scrim, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 640, backgroundColor: colors.bgKid, borderTopLeftRadius: radius.tile, borderTopRightRadius: radius.tile, padding: space.xl, gap: space.lg, alignItems: 'center' },
  title: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  mic: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.tomato, alignItems: 'center', justifyContent: 'center', borderWidth: border.thick, borderColor: colors.ink },
  micOn: { backgroundColor: colors.pink },
  row: { flexDirection: 'row', gap: space.md },
  preset: { minHeight: 56, paddingHorizontal: space.lg, borderRadius: radius.button, justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surface, borderWidth: border.normal, borderColor: colors.borderSoft },
  presetText: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
});
