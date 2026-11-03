// Magic Sketch (A7 Feature 2): pick (or get) a drawing → wand → result beside the original → "Keep it!" saves a NEW artwork.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveArtworkFiles } from '@/canvas/saveArtwork';
import { KidHeader } from '@/components/kid/KidHeader';
import { MagicWaiting } from '@/components/kid/MagicWaiting';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { saveAiResult } from '@/db/repositories/aiResultRepo';
import { getArtwork, listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { pngAtLongEdge } from '@/games/paper/processPhoto';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { magicSketch, mascotLineFor, type MascotLine } from '@/services/ai';
import { playSound } from '@/services/audio';
import { fileUri, readBase64 } from '@/services/files';
import { sayText } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

export const SKETCH_INPUT_EDGE = 768;

// Magic Sketch screen.
export function MagicSketchScreen() {
  const { isTablet, width } = useLayout();
  const params = useLocalSearchParams<{ artworkId?: string }>();
  const kidId = useSessionStore((s) => s.activeKidId);
  const ageMode = useSessionStore((s) => s.ageMode);
  const [art, setArt] = useState<ArtworkRecord | null>(null);
  const [choices, setChoices] = useState<ArtworkRecord[]>([]);
  const [result, setResult] = useState<{ id: string; png: string } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<MascotLine | null>(null);
  const cancelled = useRef(false);
  const slide = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ opacity: slide.get(), transform: [{ translateX: (1 - slide.get()) * 80 }] }));

  useEffect(() => {
    if (params.artworkId) getArtwork(params.artworkId).then(setArt).catch(() => undefined);
    else if (kidId) listArtworks(kidId, { excludeActivities: ['flipbook_frame', 'magic'] }).then(setChoices).catch(() => undefined);
  }, [params.artworkId, kidId]);

  const run = async (a: ArtworkRecord) => {
    const b64 = await readBase64(a.pngPath);
    if (!b64) return;
    setError(null);
    setWaiting(true);
    cancelled.current = false;
    const r = await magicSketch({ ageMode, imageBase64: pngAtLongEdge(b64, 2048, 2048, SKETCH_INPUT_EDGE) });
    if (cancelled.current) return;
    setWaiting(false);
    if (!r.ok) {
      const line = mascotLineFor(r.code);
      setError(line);
      sayText(line.text);
      return;
    }
    playSound('save-sparkle');
    setResult({ id: r.id, png: r.data.imageBase64 });
    slide.set(0);
    slide.set(withTiming(1, { duration: 700 }));
  };

  const keep = async () => {
    if (!kidId || !art || !result) return;
    const png = result.png;
    const id = await saveArtworkFiles({ kidId, activity: 'magic', doc: null, durationSec: 0, title: art.title ? `Magic ${art.title}` : null, exportPng: async (le) => pngAtLongEdge(png, 1024, 1024, le) });
    await saveAiResult({ id: result.id, kidId, feature: 'magic_sketch', sourceArtworkId: art.id, outputArtworkId: id, createdAt: Date.now() });
    await checkRewards(kidId, 'MAGIC_DONE');
    router.replace({ pathname: '/gallery/[artworkId]', params: { artworkId: id } });
  };

  const box = isTablet ? Math.min(420, (width - space.xl * 3) / 2) : width - space.lg * 2;
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader />
      {!art ? (
        <ScrollView contentContainerStyle={styles.grid}>
          {choices.map((a) => (
            <PressableScale key={a.id} accessibilityLabel="Use this drawing" onPress={() => setArt(a)} style={[styles.tile, { width: isTablet ? 170 : box / 2 - space.sm }]}>
              <Image source={{ uri: fileUri(a.thumbPath) }} style={styles.thumb} resizeMode="contain" />
            </PressableScale>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.pair, !isTablet && styles.column]}>
            <Image source={{ uri: fileUri(art.pngPath) }} style={[styles.pic, { width: box, height: box }]} resizeMode="contain" accessibilityLabel="My drawing" />
            {result ? (
              <Animated.View style={slideStyle}>
                <Image source={{ uri: `data:image/png;base64,${result.png}` }} style={[styles.pic, { width: box, height: box }]} resizeMode="contain" accessibilityLabel="Magic version" />
              </Animated.View>
            ) : null}
          </View>
          {error ? <SpeechBubble text={error.text} /> : null}
          <View style={styles.row}>
            {result ? <PrimaryButton label="Keep it!" onPress={() => void keep()} /> : null}
            <PrimaryButton label={result || error ? 'Try again' : 'Make it magic!'} tone={result ? 'tomato' : 'leaf'} onPress={() => void run(art)} />
          </View>
        </ScrollView>
      )}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingVertical: space.lg },
  tile: { aspectRatio: 1, backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.sm },
  thumb: { flex: 1 },
  body: { alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
  pair: { flexDirection: 'row', gap: space.xl },
  column: { flexDirection: 'column' },
  pic: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft },
  row: { flexDirection: 'row', gap: space.lg },
});
