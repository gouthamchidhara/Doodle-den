// Coloring picker (A5): "My Pages" (AI pages) first, then category rows of bundled pages.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/kid/IconButton';
import { SpeakerIcon } from '@/components/kid/icons/SpeakerIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PageCard } from '@/components/kid/PageCard';
import { COLORING_CATEGORIES, coloringSource, pagesFor } from '@/content/coloringPages';
import { listAiResults } from '@/db/repositories/aiResultRepo';
import { getArtwork } from '@/db/repositories/artworkRepo';
import { fileUri } from '@/services/files';
import { useSessionStore } from '@/state/sessionStore';
import { colors, fonts, fontSize, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

interface MyPage {
  id: string;
  title: string;
  uri: string;
}

// Page id used for AI-made pages: the line art lives in the artwork's PNG.
export const aiPageId = (artworkId: string) => `ai-${artworkId}`;

// Picker screen.
export function ColoringPickerScreen() {
  const { isTablet, ageMode } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  const replay = useIntroVoice('intro_coloring');
  const [mine, setMine] = useState<MyPage[]>([]);
  const size = isTablet ? 220 : 150;

  useEffect(() => {
    if (!kidId) return;
    (async () => {
      const results = await listAiResults(kidId, 'coloring_page');
      const out: MyPage[] = [];
      for (const r of results) {
        const art = r.outputArtworkId ? await getArtwork(r.outputArtworkId) : null;
        if (art && !art.trashedAt) out.push({ id: art.id, title: art.title ?? 'My page', uri: fileUri(art.thumbPath) });
      }
      setMine(out);
    })().catch((e: unknown) => console.warn('[coloring] my pages failed', e));
  }, [kidId]);

  const open = (pageId: string) => router.push({ pathname: '/coloring/[pageId]', params: { pageId } });

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader right={<IconButton icon={<SpeakerIcon />} accessibilityLabel="Say it again" onPress={replay} />} />
      <ScrollView contentContainerStyle={styles.list}>
        {mine.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.h}>My Pages</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {mine.map((p) => (
                <PageCard key={p.id} title={p.title} source={{ uri: p.uri }} size={size} onPress={() => open(aiPageId(p.id))} />
              ))}
            </ScrollView>
          </View>
        ) : null}
        {COLORING_CATEGORIES.map((c) => {
          const pages = pagesFor(c.key, ageMode);
          if (pages.length === 0) return null;
          return (
            <View key={c.key} style={styles.section}>
              <Text style={styles.h}>{c.title}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {pages.map((p) => {
                  const src = coloringSource(p);
                  return src ? <PageCard key={p.id} title={p.title} source={src} size={size} onPress={() => open(p.id)} /> : null;
                })}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  list: { gap: space.xl, paddingVertical: space.xl },
  section: { gap: space.md },
  h: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  row: { gap: space.lg },
});
