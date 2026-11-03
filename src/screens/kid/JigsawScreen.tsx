// My Art Jigsaw (A5): pick a drawing, pick 4/9/16/24 pieces (Little: 4, 9), drag pieces home, best time saved.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { KidHeader } from '@/components/kid/KidHeader';
import { PressableScale } from '@/components/kid/PressableScale';
import { SparkleBurst } from '@/components/kid/SparkleBurst';
import { listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { saveResult } from '@/db/repositories/jigsawRepo';
import { JigsawBoard } from '@/games/jigsaw/JigsawBoard';
import { PIECE_COUNTS, type PieceCount } from '@/games/jigsaw/pieces';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { playSound } from '@/services/audio';
import { fileUri } from '@/services/files';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

// Piece choices for an age mode.
export function piecesFor(ageMode: 'little' | 'big'): PieceCount[] {
  return ageMode === 'little' ? [4, 9] : [...PIECE_COUNTS];
}

// Jigsaw screen.
export function JigsawScreen() {
  const { isTablet, width, ageMode } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  useIntroVoice('intro_jigsaw');
  const [arts, setArts] = useState<ArtworkRecord[]>([]);
  const [art, setArt] = useState<{ a: ArtworkRecord; aspect: number } | null>(null);
  const [count, setCount] = useState<PieceCount | null>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (!kidId) return;
    listArtworks(kidId, { excludeActivities: ['flipbook_frame'] })
      .then(setArts)
      .catch((e: unknown) => console.warn('[jigsaw] load failed', e));
  }, [kidId]);

  const pickArt = (a: ArtworkRecord) => {
    Image.getSize(
      fileUri(a.pngPath),
      (w, h) => setArt({ a, aspect: w / h }),
      () => setArt({ a, aspect: 4 / 3 }),
    );
  };

  const start = (n: PieceCount) => {
    setCount(n);
    setDone(false);
    setRound((r) => r + 1);
  };

  useEffect(() => {
    started.current = Date.now();
  }, [round]);

  const finished = async () => {
    if (!kidId || !art || !count) return;
    setDone(true);
    playSound('star');
    const sec = Math.round((Date.now() - started.current) / 1000);
    await saveResult({ kidId, artworkId: art.a.id, pieces: count, bestTimeSec: sec, completedAt: Date.now() });
    await checkRewards(kidId, 'JIGSAW_DONE', { pieces: count });
  };

  const tile = isTablet ? 180 : (width - space.lg * 3) / 2;
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader onHome={count ? () => setCount(null) : art ? () => setArt(null) : undefined} />
      {!art ? (
        <ScrollView contentContainerStyle={styles.grid}>
          {arts.map((a) => (
            <PressableScale key={a.id} accessibilityLabel="Use this drawing" onPress={() => pickArt(a)} style={[styles.tile, { width: tile, height: tile }]}>
              <Image source={{ uri: fileUri(a.thumbPath) }} style={styles.img} resizeMode="contain" />
            </PressableScale>
          ))}
          {arts.length === 0 ? <Text style={styles.h}>Make a drawing first!</Text> : null}
        </ScrollView>
      ) : !count ? (
        <View style={styles.center}>
          <Text style={styles.h}>How many pieces?</Text>
          <View style={styles.row}>
            {piecesFor(ageMode).map((n) => (
              <PressableScale key={n} accessibilityLabel={`${n} pieces`} onPress={() => start(n)} style={styles.count}>
                <Text style={styles.countText}>{n}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ) : (
        <View testID="jigsaw-area" style={styles.flex} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          {area.w > 0 ? (
            <JigsawBoard key={round} uri={fileUri(art.a.pngPath)} aspect={art.aspect} seed={art.a.id} count={count} width={area.w} height={area.h} guide={ageMode === 'little'} onDone={() => void finished()} />
          ) : null}
          {done ? <SparkleBurst radius={area.w * 0.4} /> : null}
        </View>
      )}
      {done ? (
        <ChoiceBubble
          text="You did it!"
          voiceClip="mascot_puzzle_done"
          choices={[
            { label: 'Again', onPress: () => count && start(count) },
            { label: 'New puzzle', onPress: () => (setCount(null), setArt(null), setDone(false)) },
            { label: 'Home', onPress: () => router.replace('/home') },
          ]}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingVertical: space.lg },
  tile: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.sm },
  img: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  h: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  row: { flexDirection: 'row', gap: space.lg },
  count: { width: 120, height: 120, borderRadius: radius.tile, backgroundColor: colors.tint.sky.fill, borderWidth: border.thick, borderColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.display, fontSize: fontSize.kidHero, color: colors.ink },
});
