// Coloring Page Maker (A7 Feature 1): WHO (required) / DOING / WHERE tiles, Big-mode "Say your idea", "Make my page!".
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KidHeader } from '@/components/kid/KidHeader';
import { MagicWaiting } from '@/components/kid/MagicWaiting';
import { Mascot } from '@/components/kid/Mascot';
import { MicIcon } from '@/components/kid/icons/MicIcon';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import tiles from '@/content/aiIdeaTiles.json';
import { saveAiPage } from '@/games/coloring/aiPagePost';
import { useSpeechName } from '@/games/mixing/useSpeechName';
import { makeColoringPage, mascotLineFor, type MascotLine } from '@/services/ai';
import { sayText } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

type Row = 'who' | 'doing' | 'where';
const ROWS: { key: Row; title: string }[] = [
  { key: 'who', title: 'Who?' },
  { key: 'doing', title: 'Doing what?' },
  { key: 'where', title: 'Where?' },
];

// Maker screen.
export function ColoringMakerScreen() {
  const { isTablet, ageMode } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  useIntroVoice('intro_coloring_maker');
  const [pick, setPick] = useState<Partial<Record<Row, string>>>({});
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<MascotLine | null>(null);
  const [useSpoken, setUseSpoken] = useState(false);
  const speech = useSpeechName(80);
  const cancelled = useRef(false);

  const make = async () => {
    if (!kidId) return;
    const spoken = useSpoken && speech.name ? speech.name.toLowerCase() : null;
    if (!spoken && !pick.who) return;
    setError(null);
    setWaiting(true);
    cancelled.current = false;
    const r = await makeColoringPage(spoken ? { ageMode, spokenText: spoken } : { ageMode, tiles: { who: pick.who ?? '', doing: pick.doing, where: pick.where } });
    if (cancelled.current) return;
    setWaiting(false);
    if (!r.ok) {
      const line = mascotLineFor(r.code);
      setError(line);
      sayText(line.text);
      return;
    }
    const pageId = await saveAiPage(kidId, r.id, r.data.imageBase64, r.data.idea);
    if (pageId) router.replace({ pathname: '/coloring/[pageId]', params: { pageId } });
    else setError(mascotLineFor('PROVIDER_ERROR'));
  };

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader />
      <ScrollView contentContainerStyle={styles.body}>
        {ROWS.map((row) => (
          <View key={row.key} style={styles.section}>
            <Text style={styles.h}>{row.title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {(tiles[row.key] as string[]).map((w) => {
                const on = pick[row.key] === w;
                return (
                  <PressableScale
                    key={w}
                    accessibilityLabel={w}
                    selected={on}
                    onPress={() => {
                      sayText(w);
                      setUseSpoken(false);
                      setPick((p) => ({ ...p, [row.key]: on && row.key !== 'who' ? undefined : w }));
                    }}
                    style={[styles.tile, on ? styles.on : styles.off]}
                  >
                    <Text style={styles.tileText}>{w}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        ))}
        {ageMode === 'big' ? (
          <View style={styles.speak}>
            <PressableScale accessibilityLabel="Say your idea" onPress={() => void speech.listen()} style={[styles.mic, speech.listening && styles.on]}>
              <MicIcon />
            </PressableScale>
            {speech.name ? (
              <>
                <Text style={styles.spoken}>{speech.name}</Text>
                <PrimaryButton label="Use it" onPress={() => setUseSpoken(true)} />
                <PrimaryButton label="Try again" tone="tomato" onPress={() => (speech.clear(), setUseSpoken(false), void speech.listen())} />
              </>
            ) : (
              <Text style={styles.hint}>Say your idea</Text>
            )}
          </View>
        ) : null}
        {error ? (
          <View style={styles.err}>
            <Mascot mood="idle" size={80} />
            <SpeechBubble text={error.text} />
            {error.then === 'gate' ? <PrimaryButton label="Grown-ups" onPress={() => router.push({ pathname: '/parent/gate', params: { next: '/parent/magic' } })} /> : null}
          </View>
        ) : null}
        <PrimaryButton label="Make my page!" disabled={!pick.who && !(useSpoken && speech.name)} onPress={() => void make()} />
      </ScrollView>
      {waiting ? (
        <MagicWaiting
          onCancel={() => {
            cancelled.current = true;
            setWaiting(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  body: { gap: space.lg, paddingVertical: space.lg, alignItems: 'stretch' },
  section: { gap: space.sm },
  h: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  row: { gap: space.sm },
  tile: { minHeight: 64, paddingHorizontal: space.lg, borderRadius: radius.button, justifyContent: 'center' },
  on: { backgroundColor: colors.tint.grape.fill, borderWidth: border.thick, borderColor: colors.grape },
  off: { backgroundColor: colors.surface, borderWidth: border.normal, borderColor: colors.borderSoft },
  tileText: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
  speak: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  mic: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  spoken: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.grape },
  hint: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.inkMuted },
  err: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
});
