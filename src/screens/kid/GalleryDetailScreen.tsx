// My Gallery detail (A5): big picture + Replay, Favorite, Keep drawing, (later) Magic / sticker / voice / world, hold-to-trash.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeartIcon } from '@/components/kid/icons/HeartIcon';
import { MicIcon } from '@/components/kid/icons/MicIcon';
import { PlayIcon } from '@/components/kid/icons/PlayIcon';
import { StampIcon } from '@/components/kid/icons/StampIcon';
import { TrashIcon } from '@/components/kid/icons/TrashIcon';
import { WandIcon } from '@/components/kid/icons/WandIcon';
import { CrayonIcon } from '@/components/kid/icons/CrayonIcon';
import { AquariumArt } from '@/components/kid/icons/AquariumArt';
import { KidHeader } from '@/components/kid/KidHeader';
import { ReplayCanvas } from '@/components/kid/ReplayCanvas';
import { toggleFavorite, trashArtwork } from '@/db/repositories/artworkRepo';
import { loadArtDetail, type ArtDetail } from '@/games/gallery/loadDetail';
import { playSound } from '@/services/audio';
import { fileUri } from '@/services/files';
import { isFeatureOn } from '@/state/features';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { FlipbookPlayer } from './flipbook/FlipbookPlayer';
import { DetailAction } from './gallery/DetailAction';

export const TRASH_HOLD_MS = 1500;

// Gallery detail screen.
export function GalleryDetailScreen() {
  const { isTablet, width, height } = useLayout();
  const { artworkId } = useLocalSearchParams<{ artworkId: string }>();
  const [d, setD] = useState<ArtDetail | null>(null);
  const [replay, setReplay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stopReplay = useCallback(() => setReplay(0), []);

  useEffect(() => {
    if (!artworkId) return;
    loadArtDetail(artworkId)
      .then(setD)
      .catch((e: unknown) => console.warn('[gallery] detail failed', e));
  }, [artworkId]);

  if (!d) return <SafeAreaView style={styles.screen} />;
  const a = d.art;
  const box = Math.min(isTablet ? width - 260 : width - space.lg * 2, height - (isTablet ? 200 : 360));
  const aspect = d.doc?.aspect ?? 1;
  const w = aspect >= 1 ? box : box * aspect;
  const h = aspect >= 1 ? box / aspect : box;

  const favorite = async () => {
    const on = await toggleFavorite(a.id);
    setD({ ...d, art: { ...a, isFavorite: on } });
    playSound(on ? 'star' : 'tap');
  };

  const trash = async () => {
    await trashArtwork(a.id);
    playSound('bubble');
    router.back();
  };

  const keepDrawing =
    a.activity === 'draw'
      ? () => router.push({ pathname: '/draw', params: { artworkId: a.id } })
      : a.activity === 'coloring' && d.coloringPageId
        ? () => router.push({ pathname: '/coloring/[pageId]', params: { pageId: d.coloringPageId ?? '', artworkId: a.id } })
        : null;

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader onHome={() => router.back()} />
      <View style={[styles.body, isTablet && styles.row]}>
        <View style={styles.center}>
          <View style={[styles.frame, { width: w, height: h }]}>
            {replay > 0 && d.doc ? (
              <ReplayCanvas key={replay} doc={d.doc} width={w} height={h} symmetry={d.symmetry} onDone={stopReplay} />
            ) : (
              <Image source={{ uri: `${fileUri(a.pngPath)}?v=${a.updatedAt}` }} style={{ width: w, height: h }} resizeMode="contain" accessibilityLabel="My drawing" />
            )}
          </View>
        </View>
        <ScrollView horizontal={!isTablet} contentContainerStyle={[styles.actions, isTablet && styles.actionsCol]}>
          {d.flipbook ? <DetailAction icon={<PlayIcon />} label="Play" onPress={() => setPlaying(true)} /> : null}
          {d.doc && a.activity !== 'coloring' ? <DetailAction icon={<PlayIcon />} label="Replay" onPress={() => setReplay((n) => n + 1)} /> : null}
          <DetailAction icon={<HeartIcon color={a.isFavorite ? colors.tomato : colors.ink} />} label="Favorite" selected={a.isFavorite} onPress={() => void favorite()} />
          {keepDrawing ? <DetailAction icon={<CrayonIcon />} label="Keep drawing" onPress={keepDrawing} /> : null}
          {isFeatureOn('magicSketch') ? <DetailAction icon={<WandIcon />} label="Magic" onPress={() => router.push({ pathname: '/magic/sketch', params: { artworkId: a.id } })} /> : null}
          {isFeatureOn('stickers') ? <DetailAction icon={<StampIcon />} label="Make a sticker" /> : null}
          {isFeatureOn('voices') ? <DetailAction icon={<MicIcon />} label="Give it a voice" /> : null}
          {isFeatureOn('worlds') ? <DetailAction icon={<AquariumArt size={30} />} label="Put in a world" /> : null}
          <DetailAction icon={<TrashIcon />} label="Hold to trash" onLongPress={() => void trash()} delayLongPress={TRASH_HOLD_MS} />
        </ScrollView>
      </View>
      {playing && d.frames.length > 0 && d.flipbook ? <FlipbookPlayer frames={d.frames} fps={d.flipbook.fps} width={Math.min(width * 0.8, 700)} onClose={() => setPlaying(false)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  body: { flex: 1, gap: space.lg, paddingTop: space.lg },
  row: { flexDirection: 'row' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: border.thick, borderColor: colors.borderSoft, overflow: 'hidden' },
  actions: { gap: space.md, paddingVertical: space.sm },
  actionsCol: { flexDirection: 'column' },
});
