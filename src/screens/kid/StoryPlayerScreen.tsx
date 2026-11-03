// Story player (A7 Feature 3): one drawing per page, big text read aloud (0.9 Little / 1.0 Big), pages turn by themselves.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { getArtwork } from '@/db/repositories/artworkRepo';
import { getStory } from '@/db/repositories/storyRepo';
import { fileUri } from '@/services/files';
import { sayTextThen, stopVoice } from '@/services/voice';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { Story } from '@/types/feature';

const PAGE_PAUSE_MS = 1200;

// Player screen.
export function StoryPlayerScreen() {
  const { isTablet, width, height, ageMode } = useLayout();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [uris, setUris] = useState<string[]>([]);
  const [page, setPage] = useState(-1); // -1 = title
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!storyId) return;
    (async () => {
      const s = await getStory(storyId);
      if (!s) return;
      const list: string[] = [];
      for (const id of s.artworkIds) {
        const a = await getArtwork(id);
        list.push(a ? fileUri(a.pngPath) : '');
      }
      setUris(list);
      setStory(s);
    })().catch(() => undefined);
  }, [storyId]);

  useEffect(() => {
    if (!story) return undefined;
    let t: ReturnType<typeof setTimeout> | undefined;
    const text = page < 0 ? story.title : (story.pages[page]?.text ?? '');
    sayTextThen(text, ageMode === 'little' ? 0.9 : 1.0, () => {
      if (page < story.pages.length - 1) t = setTimeout(() => setPage((p) => p + 1), PAGE_PAUSE_MS);
    });
    return () => {
      if (t) clearTimeout(t);
      stopVoice();
    };
  }, [story, page, run, ageMode]);

  if (!story) return <SafeAreaView style={styles.screen} />;
  const p = page >= 0 ? story.pages[page] : null;
  const uri = uris[p ? p.artIndex : 0];
  const pic = Math.min(isTablet ? width * 0.5 : width - space.lg * 2, height * 0.5);
  const last = page >= story.pages.length - 1;
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader onHome={() => router.back()} />
      <View style={styles.body}>
        {uri ? <Image source={{ uri }} style={[styles.pic, { width: pic, height: pic }]} resizeMode="contain" accessibilityLabel="Story drawing" /> : null}
        <Text style={[styles.text, page < 0 && styles.title]}>{p ? p.text : story.title}</Text>
      </View>
      <View style={styles.row}>
        <PrimaryButton label="Replay" tone="tomato" onPress={() => (setPage(-1), setRun((r) => r + 1))} />
        {last ? <PrimaryButton label="Done" onPress={() => router.back()} /> : <PrimaryButton label="Next" onPress={() => setPage((x) => x + 1)} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  pic: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft },
  text: { fontFamily: fonts.display, fontSize: fontSize.title + 4, color: colors.ink, textAlign: 'center', maxWidth: 820 },
  title: { fontSize: fontSize.kidHero, color: colors.grape },
  row: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, paddingBottom: space.lg },
});
