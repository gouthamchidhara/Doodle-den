// Shared world screen shell (A5, mockup Aquarium): full-bleed scene, title pill, extra + Album buttons, "Draw a new fish".
import { router, useLocalSearchParams } from 'expo-router';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/kid/IconButton';
import { GalleryArt } from '@/components/kid/icons/GalleryArt';
import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { VoiceSheet } from '@/games/voice/VoiceSheet';
import { isFeatureOn } from '@/state/features';
import { isParentUnlocked } from '@/state/parentStore';
import { useActiveKid } from '@/state/useActiveKid';
import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';
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
  clock: SharedValue<number>;
  background: (w: number, h: number) => ReactNode;
  foreground?: (w: number, h: number) => ReactNode;
  extraButton?: ReactNode;
  onSize?: (w: number, h: number) => void;
  onLongPressCreature?: (c: Creature) => void;
  drawOrder?: (count: number) => number[];
}

// World screen layout.
export function WorldScreen({ cfg, motion, ext, clock, background, foreground, extraButton, onSize, onLongPressCreature, drawOrder }: WorldScreenProps) {
  const { isTablet, height } = useLayout();
  const kid = useActiveKid();
  const params = useLocalSearchParams<{ enter?: string; granted?: string }>();
  const { onScreen, album, total, restore, reload } = useWorldCreatures(cfg.key, cfg.max);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [voiceFor, setVoiceFor] = useState<Creature | null>(null);

  useEffect(() => {
    if (params.granted === '1' && isParentUnlocked()) requestRecordingPermissionsAsync().catch(() => undefined);
  }, [params.granted]);

  const title = worldTitle(cfg, kid?.nickname, total);
  return (
    <View style={styles.screen}>
      <WorldScene
        creatures={onScreen}
        motion={motion}
        background={background}
        foreground={foreground}
        sound={cfg.sound}
        ext={ext}
        clock={clock}
        enteringId={params.enter ?? null}
        screenH={height}
        onSize={onSize}
        drawOrder={drawOrder}
        onLongPress={(c) => {
          if (!isFeatureOn('voices')) return;
          if (onLongPressCreature) onLongPressCreature(c);
          else setVoiceFor(c);
        }}
      />
      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View pointerEvents="box-none" style={[styles.top, { paddingHorizontal: isTablet ? space.xl : space.lg }]}>
          <KidHeader
            left={isTablet ? <Text style={styles.title}>{title}</Text> : null}
            right={
              <>
                {extraButton}
                {album.length > 0 ? <IconButton icon={<GalleryArt size={36} />} accessibilityLabel="Album" onPress={() => setAlbumOpen(true)} /> : null}
              </>
            }
          />
          {!isTablet ? <Text style={[styles.title, styles.titlePhone]}>{title}</Text> : null}
        </View>
        <View pointerEvents="box-none" style={styles.bottom}>
          <PrimaryButton label={`Draw a new ${cfg.noun}`} tone="tomato" onPress={() => router.push({ pathname: '/world-draw', params: { world: cfg.key } })} />
        </View>
      </SafeAreaView>
      {voiceFor && kid ? (
        <VoiceSheet kidId={kid.id} target={{ entityId: voiceFor.entity.id }} returnTo={cfg.route} onClose={() => setVoiceFor(null)} onSaved={() => void reload()} />
      ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  top: { paddingVertical: space.md, gap: space.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.bubble, color: colors.ink, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: space.xl, paddingVertical: space.md, overflow: 'hidden' },
  titlePhone: { alignSelf: 'center', fontSize: fontSize.body },
  bottom: { position: 'absolute', bottom: space.xl, left: 0, right: 0, alignItems: 'center' },
});
