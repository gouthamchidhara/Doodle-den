// Gallery grid tile: thumbnail with play / sparkle / speaker badges.
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { GalleryItem } from '@/games/gallery/galleryItems';
import { fileUri } from '@/services/files';
import { border, colors, radius, space } from '@/theme/tokens';

import { HeartIcon } from './icons/HeartIcon';
import { PlayIcon } from './icons/PlayIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { WandIcon } from './icons/WandIcon';
import { PressableScale } from './PressableScale';

// One drawing in the grid.
export function ArtTile({ item, size, onPress }: { item: GalleryItem; size: number; onPress: () => void }) {
  const a = item.artwork;
  const label = item.flipbookId ? 'Flipbook' : (a.title ?? 'My drawing');
  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} style={[styles.tile, { width: size, height: size }]}>
      <Image source={{ uri: `${fileUri(a.thumbPath)}?v=${a.updatedAt}` }} style={styles.img} resizeMode="contain" />
      <View style={styles.badges}>
        {item.badges.play ? <Badge icon={<PlayIcon size={18} />} /> : null}
        {item.badges.sparkle ? <Badge icon={<WandIcon size={18} />} /> : null}
        {item.badges.voice ? <Badge icon={<SpeakerIcon size={18} />} /> : null}
        {a.isFavorite ? <Badge icon={<HeartIcon size={18} color={colors.tomato} />} /> : null}
      </View>
    </PressableScale>
  );
}

// Small round badge.
function Badge({ icon }: { icon: ReactNode }) {
  return <View style={styles.badge}>{icon}</View>;
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden', padding: space.sm },
  img: { flex: 1 },
  badges: { position: 'absolute', top: space.sm, right: space.sm, flexDirection: 'row', gap: space.xs },
  badge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.borderNeutral, alignItems: 'center', justifyContent: 'center' },
});
