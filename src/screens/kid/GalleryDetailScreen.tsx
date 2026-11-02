// My Gallery detail (A5): big picture + Replay, Favorite, Keep drawing, (later) Magic / sticker / voice / world, hold-to-trash.
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeartIcon } from '@/components/kid/icons/HeartIcon';
import { MicIcon } from '@/components/kid/icons/MicIcon';
import { PlayIcon } from '@/components/kid/icons/PlayIcon';
import { SpeakerIcon } from '@/components/kid/icons/SpeakerIcon';
import { StampIcon } from '@/components/kid/icons/StampIcon';
import { TrashIcon } from '@/components/kid/icons/TrashIcon';
import { WandIcon } from '@/components/kid/icons/WandIcon';
import { CrayonIcon } from '@/components/kid/icons/CrayonIcon';
import { AquariumArt } from '@/components/kid/icons/AquariumArt';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { KidHeader } from '@/components/kid/KidHeader';
import { ReplayCanvas } from '@/components/kid/ReplayCanvas';
import { toggleFavorite, trashArtwork } from '@/db/repositories/artworkRepo';
import { loadArtDetail, type ArtDetail } from '@/games/gallery/loadDetail';
import { playVoiceClip } from '@/games/voice/playVoice';
import { voiceForArtwork } from '@/games/voice/voiceStore';
import { VoiceSheet } from '@/games/voice/VoiceSheet';
import { addCreature, randomCreatureName } from '@/games/worlds/addCreature';
import { WORLDS, type PlayWorld } from '@/games/worlds/worldConfig';
import { playSound } from '@/services/audio';
import { fileUri } from '@/services/files';
import { isFeatureOn } from '@/state/features';
import { isParentUnlocked } from '@/state/parentStore';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { FlipbookPlayer } from './flipbook/FlipbookPlayer';
import { DetailAction } from './gallery/DetailAction';

export const TRASH_HOLD_MS = 1500;

// Gallery detail screen.
export function GalleryDetailScreen() {
  const { isTablet, width, height } = useLayout();
  const params = useLocalSearchParams<{ artworkId: string; granted?: string }>();
  const { artworkId } = params;
  const [d, setD] = useState<ArtDetail | null>(null);
  const [replay, setReplay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [worldPick, setWorldPick] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const stopReplay = useCallback(() => setReplay(0), []);

  useEffect(() => {
    if (!artworkId) return;
    loadArtDetail(artworkId)
      .then(setD)
      .catch((e: unknown) => console.warn('[gallery] detail failed', e));
    voiceForArtwork(artworkId)
      .then(setVoiceId)
      .catch(() => undefined);
  }, [artworkId]);

  useEffect(() => {
    if (params.granted === '1' && isParentUnlocked()) requestRecordingPermissionsAsync().catch(() => undefined);
  }, [params.granted]);

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

  const putIn = async (w: PlayWorld) => {
    setWorldPick(false);
    const entityId = await addCreature(a.kidId, w, a.id, randomCreatureName());
    router.push({ pathname: WORLDS[w].route, params: { enter: entityId } });
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
          {isFeatureOn('voices') ? <DetailAction icon={<MicIcon />} label="Give it a voice" onPress={() => setVoiceOpen(true)} /> : null}
          {voiceId ? <DetailAction icon={<SpeakerIcon />} label="Hear it" onPress={() => void playVoiceClip(voiceId)} /> : null}
          {isFeatureOn('worlds') && !d.flipbook ? <DetailAction icon={<AquariumArt size={30} />} label="Put in a world" onPress={() => setWorldPick(true)} /> : null}
          <DetailAction icon={<TrashIcon />} label="Hold to trash" onLongPress={() => void trash()} delayLongPress={TRASH_HOLD_MS} />
        </ScrollView>
      </View>
      {voiceOpen ? (
        <VoiceSheet kidId={a.kidId} target={{ artworkId: a.id }} returnTo={`/gallery/${a.id}`} onClose={() => setVoiceOpen(false)} onSaved={setVoiceId} />
      ) : null}
      {worldPick ? (
        <ChoiceBubble
          text="Which world?"
          choices={[
            ...(['aquarium', 'zoo', 'racetrack'] as const).map((w) => ({ label: WORLDS[w].title, onPress: () => void putIn(w) })),
            { label: 'Not now', tone: 'tomato' as const, onPress: () => setWorldPick(false) },
          ]}
        />
      ) : null}
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
