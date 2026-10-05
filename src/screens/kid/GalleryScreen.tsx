// My Gallery grid (A5): All / Favorites, newest first; tablet 4 columns, phone 2.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtTile } from '@/components/kid/ArtTile';
import { ChipTabs } from '@/components/kid/ChipTabs';
import { KidHeader } from '@/components/kid/KidHeader';
import { Mascot } from '@/components/kid/Mascot';
import { loadGalleryItems, type GalleryFilter, type GalleryItem } from '@/games/gallery/galleryItems';
import { useSessionStore } from '@/state/sessionStore';
import { colors, fonts, fontSize, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

const TABS: { key: GalleryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
];

// Gallery grid screen.
export function GalleryScreen() {
  const { isTablet, width } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  useIntroVoice('intro_gallery');
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!kidId) return;
      loadGalleryItems(kidId, filter)
        .then(setItems)
        .catch((e: unknown) => console.warn('[gallery] load failed', e));
    }, [kidId, filter]),
  );

  const pad = isTablet ? space.xl : space.lg;
  const cols = isTablet ? 4 : 2;
  const gap = isTablet ? space.lg : space.md;
  const size = (width - pad * 2 - gap * (cols - 1)) / cols;

  return (
    <SafeAreaView style={[styles.screen, { padding: pad }]}>
      <KidHeader />
      <View style={styles.tabs}>
        <ChipTabs tabs={TABS} selected={filter} onSelect={setFilter} />
      </View>
      {items && items.length === 0 ? (
        <View style={styles.empty}>
          <Mascot mood="idle" />
          <Text style={styles.emptyText}>{filter === 'favorites' ? 'Tap the heart on a drawing you love!' : "Let's make your first drawing!"}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, { gap }]}>
          {(items ?? []).map((it) => (
            <ArtTile key={it.artwork.id} item={it} size={size} onPress={() => router.push({ pathname: '/gallery/[artworkId]', params: { artworkId: it.artwork.id } })} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  tabs: { paddingVertical: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: space.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  emptyText: { fontFamily: fonts.displayMedium, fontSize: fontSize.bubble, color: colors.ink, textAlign: 'center' },
});
