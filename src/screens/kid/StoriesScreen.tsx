// Stories (A5): cards with the title and first drawing, newest first; tap to play. Kids cannot delete stories.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KidHeader } from '@/components/kid/KidHeader';
import { Mascot } from '@/components/kid/Mascot';
import { PressableScale } from '@/components/kid/PressableScale';
import { getArtwork } from '@/db/repositories/artworkRepo';
import { listStories } from '@/db/repositories/storyRepo';
import { fileUri } from '@/services/files';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

// Stories list.
export function StoriesScreen() {
  const { isTablet, width } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  useIntroVoice('intro_stories');
  const [cards, setCards] = useState<{ id: string; title: string; uri: string }[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!kidId) return;
      (async () => {
        const out: { id: string; title: string; uri: string }[] = [];
        for (const s of await listStories(kidId)) {
          const a = s.artworkIds[0] ? await getArtwork(s.artworkIds[0]) : null;
          out.push({ id: s.id, title: s.title, uri: a ? fileUri(a.thumbPath) : '' });
        }
        setCards(out);
      })().catch(() => undefined);
    }, [kidId]),
  );

  const w = isTablet ? 240 : (width - space.lg * 3) / 2;
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader />
      {cards && cards.length === 0 ? (
        <View style={styles.empty}>
          <Mascot mood="idle" />
          <Text style={styles.title}>Make a story in the Magic shelf!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {(cards ?? []).map((c) => (
            <PressableScale key={c.id} accessibilityLabel={c.title} onPress={() => router.push({ pathname: '/story/[storyId]', params: { storyId: c.id } })} style={[styles.card, { width: w }]}>
              {c.uri ? <Image source={{ uri: c.uri }} style={{ width: w - space.lg * 2, height: w - space.lg * 2 }} resizeMode="contain" /> : null}
              <Text style={styles.title} numberOfLines={2}>
                {c.title}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingVertical: space.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.tint.sun.border, padding: space.lg, gap: space.sm, alignItems: 'center' },
  title: { fontFamily: fonts.display, fontSize: fontSize.body + 2, color: colors.ink, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
});
