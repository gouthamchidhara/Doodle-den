// Shared world screen shell (A5): title "{nickname}'s Aquarium · 6 fish", Album, scene, "Draw a new fish" + extra button.
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/kid/IconButton';
import { GalleryArt } from '@/components/kid/icons/GalleryArt';
import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { isFeatureOn } from '@/state/features';
import { useActiveKid } from '@/state/useActiveKid';
import { colors, fonts, fontSize, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { AlbumDrawer } from './AlbumDrawer';
import type { Creature, MotionFn } from './types';
import { useWorldCreatures } from './useWorldCreatures';
import { worldTitle, type WorldConfig } from './worldConfig';
import { WorldScene } from './WorldScene';

export interface WorldScreenProps {
  cfg: WorldConfig;
  motion: MotionFn;
  ext: SharedValue<number[]>;
  background: (w: number, h: number) => ReactNode;
  foreground?: (w: number, h: number) => ReactNode;
  extraButton?: ReactNode;
  onSize?: (w: number, h: number) => void;
  onLongPressCreature?: (c: Creature) => void;
}

// World screen layout.
export function WorldScreen({ cfg, motion, ext, background, foreground, extraButton, onSize, onLongPressCreature }: WorldScreenProps) {
  const { isTablet, height } = useLayout();
  const kid = useActiveKid();
  const params = useLocalSearchParams<{ enter?: string }>();
  const { onScreen, album, total, restore } = useWorldCreatures(cfg.key, cfg.max);
  const [albumOpen, setAlbumOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.top, { paddingHorizontal: isTablet ? space.xl : space.lg }]}>
        <KidHeader
          left={isTablet ? <Text style={styles.title}>{worldTitle(cfg, kid?.nickname, total)}</Text> : null}
          right={album.length > 0 ? <IconButton icon={<GalleryArt size={36} />} accessibilityLabel="Album" onPress={() => setAlbumOpen(true)} /> : null}
        />
        {!isTablet ? <Text style={styles.title}>{worldTitle(cfg, kid?.nickname, total)}</Text> : null}
      </View>
      <WorldScene
        creatures={onScreen}
        motion={motion}
        background={background}
        foreground={foreground}
        sound={cfg.sound}
        ext={ext}
        enteringId={params.enter ?? null}
        screenH={height}
        onSize={onSize}
        onLongPress={(c) => (isFeatureOn('voices') ? onLongPressCreature?.(c) : undefined)}
      />
      <View style={[styles.bottom, { paddingHorizontal: isTablet ? space.xl : space.lg }]}>
        <PrimaryButton label={`Draw a new ${cfg.noun}`} tone="tomato" onPress={() => router.push({ pathname: '/world-draw', params: { world: cfg.key } })} />
        {extraButton}
      </View>
      {albumOpen ? (
        <AlbumDrawer
          album={album}
          onPick={(id) => {
            void restore(id);
            setAlbumOpen(false);
          }}
          onClose={() => setAlbumOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  top: { paddingVertical: space.md, gap: space.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  bottom: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, paddingVertical: space.md },
});
