// Story Maker (A7 Feature 3): pick 1–4 drawings (numbered in tap order) → "Make my story!" → saved story opens in the player.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KidHeader } from '@/components/kid/KidHeader';
import { MagicWaiting } from '@/components/kid/MagicWaiting';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { getMeta } from '@/db/repositories/metaRepo';
import { saveStory } from '@/db/repositories/storyRepo';
import { pngAtLongEdge } from '@/games/paper/processPhoto';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { makeStory, mascotLineFor, type MascotLine } from '@/services/ai';
import { NICKNAME_KEY } from '@/services/aiConsent';
import { fileUri, readBase64 } from '@/services/files';
import { sayText } from '@/services/voice';
import { useActiveKid } from '@/state/useActiveKid';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

export const MAX_STORY_ART = 4;

// Adds or removes a drawing; order of taps = page order.
export function toggleStoryPick(picked: string[], id: string): string[] {
  if (picked.includes(id)) return picked.filter((x) => x !== id);
  return picked.length >= MAX_STORY_ART ? picked : [...picked, id];
}

// Story Maker screen.
export function StoryMakerScreen() {
  const { isTablet, width, ageMode } = useLayout();
  const kid = useActiveKid();
  useIntroVoice('intro_story_maker');
  const [arts, setArts] = useState<ArtworkRecord[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<MascotLine | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!kid) return;
    listArtworks(kid.id, { excludeActivities: ['flipbook_frame'] }).then(setArts).catch(() => undefined);
  }, [kid]);

  const make = async () => {
    if (!kid || picked.length === 0) return;
    setError(null);
    setWaiting(true);
    cancelled.current = false;
    const images: string[] = [];
    for (const id of picked) {
      const a = arts.find((x) => x.id === id);
      const b64 = a ? await readBase64(a.pngPath) : null;
      if (b64) images.push(pngAtLongEdge(b64, 2048, 2048, 512));
    }
    const useNick = (await getMeta(NICKNAME_KEY)) === '1';
    const r = await makeStory({ ageMode, images, ...(useNick ? { heroName: kid.nickname } : {}) });
    if (cancelled.current) return;
    setWaiting(false);
    if (!r.ok) {
      const line = mascotLineFor(r.code);
      setError(line);
      sayText(line.text);
      return;
    }
    await saveStory({ id: r.id, kidId: kid.id, title: r.data.title, pages: r.data.pages, artworkIds: picked, createdAt: Date.now() });
    await checkRewards(kid.id, 'STORY_MADE');
    router.replace({ pathname: '/story/[storyId]', params: { storyId: r.id } });
  };

  const tile = isTablet ? 180 : (width - space.lg * 3) / 2;
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader right={<PrimaryButton label="Make my story!" disabled={picked.length === 0} onPress={() => void make()} />} />
      {error ? <SpeechBubble text={error.text} /> : null}
      <ScrollView contentContainerStyle={styles.grid}>
        {arts.map((a) => {
          const n = picked.indexOf(a.id);
          return (
            <PressableScale key={a.id} accessibilityLabel={n >= 0 ? `Page ${n + 1}` : 'Pick this drawing'} selected={n >= 0} onPress={() => setPicked((p) => toggleStoryPick(p, a.id))} style={[styles.tile, { width: tile, height: tile }, n >= 0 && styles.on]}>
              <Image source={{ uri: fileUri(a.thumbPath) }} style={styles.img} resizeMode="contain" />
              {n >= 0 ? (
                <View style={styles.num}>
                  <Text style={styles.numText}>{n + 1}</Text>
                </View>
              ) : null}
            </PressableScale>
          );
        })}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingVertical: space.lg },
  tile: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.sm },
  on: { borderWidth: border.selected, borderColor: colors.sun },
  img: { flex: 1 },
  num: { position: 'absolute', top: space.sm, left: space.sm, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center', borderWidth: border.normal, borderColor: colors.ink },
  numText: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
});
