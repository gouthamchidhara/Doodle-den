// Big filled kid button ("I'm done!", "Draw a new fish") (A2).
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { PressableScale } from './PressableScale';

export interface PrimaryButtonProps {
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
  tone?: 'leaf' | 'tomato';
  disabled?: boolean;
}

// Leaf or tomato pill with white display text and an optional icon.
export function PrimaryButton({ label, icon, onPress, tone = 'leaf', disabled }: PrimaryButtonProps) {
  const { isTablet } = useLayout();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { height: isTablet ? 64 : 52, backgroundColor: colors[tone], opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {icon}
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    paddingHorizontal: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  label: { color: colors.white, fontFamily: fonts.display, fontSize: fontSize.button },
});
