// Pastel Kid Home tile with a big illustration and label (A2).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { PadlockIcon } from './icons/PadlockIcon';
import { PressableScale } from './PressableScale';

export type TintKey = keyof typeof colors.tint;

export interface ActivityTileProps {
  title: string;
  tint: TintKey;
  icon: ReactNode;
  badge?: 'NEW';
  locked?: boolean;
  dimmed?: boolean;
  onPress?: () => void;
  onLockedPress?: () => void;
}

// Tile button; a locked tile opens the Parent Gate instead (never shows a price).
export function ActivityTile({ title, tint, icon, badge, locked, dimmed, onPress, onLockedPress }: ActivityTileProps) {
  const { isTablet } = useLayout();
  const t = colors.tint[tint];
  const handlePress = () => {
    if (!locked) {
      onPress?.();
    } else if (onLockedPress) {
      onLockedPress();
    } else {
      router.push('/parent/gate');
    }
  };
  return (
    <PressableScale
      accessibilityLabel={title}
      onPress={handlePress}
      style={[
        styles.tile,
        { backgroundColor: t.fill, borderColor: t.border, height: isTablet ? 248 : 180, opacity: dimmed ? 0.55 : 1 },
      ]}
    >
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {locked ? (
        <View style={styles.lock}>
          <PadlockIcon size={26} />
        </View>
      ) : null}
      <View style={{ width: isTablet ? 120 : 90, height: isTablet ? 120 : 90 }}>{icon}</View>
      <Text style={[styles.label, { fontSize: isTablet ? fontSize.tileLabel : fontSize.button }]} numberOfLines={1}>
        {title}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.tile,
    borderWidth: border.thick,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  label: { fontFamily: fonts.display, color: colors.ink },
  badge: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: colors.tomato,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  badgeText: { color: colors.white, fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption },
  lock: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    padding: space.xs,
  },
});
