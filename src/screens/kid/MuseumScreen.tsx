// Museum Night (A5): pick 3–6 drawings (favorites first) or "Surprise me", then a ~45 s night show; saved as an exhibit.
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { parseStrokeDoc } from '@/canvas/saveArtwork';
import { KidHeader } from '@/components/kid/KidHeader';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { getArtwork, listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { saveExhibit } from '@/db/repositories/museumRepo';
import { listAllEntities } from '@/db/repositories/worldRepo';
import { MAX_PARADE, MIN_PICK, pickOrder, surprise, togglePick } from '@/games/museum/museumPlan';
import { MuseumShow, type ShowArt } from '@/games/museum/MuseumShow';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { fileUri, readText } from '@/services/files';
import { useActiveKid } from '@/state/useActiveKid';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import { newId } from '@/utils/ids';

import { useIntroVoice } from './shared/useIntroVoice';

// Museum screen.
export function MuseumScreen() {
  const { isTablet, width, height } = useLayout();
  const kid = useActiveKid();
  useIntroVoice('intro_museum');
  const [arts, setArts] = useState<ArtworkRecord[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [show, setShow] = useState<{ arts: ShowArt[]; creatures: string[]; n: number } | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!kid) return;
    listArtworks(kid.id, { excludeActivities: ['flipbook_frame'] })
      .then((a) => setArts(pickOrder(a)))
      .catch((e: unknown) => console.warn('[museum] load failed', e));
  }, [kid]);

  const open = async (ids: string[]) => {
    if (!kid || ids.length < Math.min(MIN_PICK, arts.length) || ids.length === 0) return;
    const showArts: ShowArt[] = [];
    for (const id of ids) {
      const a = arts.find((x) => x.id === id);
      if (a) showArts.push({ id, uri: fileUri(a.pngPath), doc: parseStrokeDoc(a.strokesPath ? await readText(a.strokesPath) : null) });
    }
    const creatures: string[] = [];
    for (const e of (await listAllEntities(kid.id)).slice(0, MAX_PARADE)) {
      const art = await getArtwork(e.artworkId);
      if (art) creatures.push(fileUri(art.pngPath));
    }
    setEnded(false);
    setShow((s) => ({ arts: showArts, creatures, n: (s?.n ?? 0) + 1 }));
    await saveExhibit({ id: newId(), kidId: kid.id, artworkIds: ids, createdAt: Date.now() });
    await checkRewards(kid.id, 'MUSEUM_OPENED');
  };

  if (show) {
    return (
      <View style={styles.night}>
        <MuseumShow key={show.n} arts={show.arts} creatures={show.creatures} nickname={kid?.nickname} width={width} height={height} onEnd={() => setEnded(true)} />
        <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.pad} pointerEvents="box-none">
            <KidHeader onHome={() => setShow(null)} showPill={false} right={ended ? <PrimaryButton label="Again!" onPress={() => setShow((s) => (s ? { ...s, n: s.n + 1 } : s))} /> : null} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const tile = isTablet ? 170 : (width - space.lg * 3) / 2;
  const need = Math.min(MIN_PICK, arts.length);
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader right={<PrimaryButton label="Surprise me" tone="tomato" onPress={() => void open(surprise(arts))} />} />
      <Text style={styles.h}>{`Pick ${MIN_PICK} to 6 drawings`}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {arts.map((a) => {
          const on = picked.includes(a.id);
          return (
            <PressableScale key={a.id} accessibilityLabel={on ? 'Picked drawing' : 'Pick this drawing'} selected={on} onPress={() => setPicked((p) => togglePick(p, a.id))} style={[styles.tile, { width: tile, height: tile }, on && styles.on]}>
              <Image source={{ uri: fileUri(a.thumbPath) }} style={styles.img} resizeMode="contain" />
            </PressableScale>
          );
        })}
      </ScrollView>
      <View style={styles.bottom}>
        <PrimaryButton label="Open the museum!" disabled={picked.length < need || picked.length === 0} onPress={() => void open(picked)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  night: { flex: 1, backgroundColor: colors.night },
  pad: { padding: space.lg },
  h: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink, paddingVertical: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingBottom: space.xl },
  tile: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.sm },
  on: { borderWidth: border.selected, borderColor: colors.sun },
  img: { flex: 1 },
  bottom: { alignItems: 'center', paddingTop: space.md },
});
