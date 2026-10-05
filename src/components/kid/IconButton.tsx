// Square white icon button used in kid top bars (A2).
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { border, colors, radius } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

export interface IconButtonProps {
  icon: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  size?: 64 | 52;
}

// White rounded button holding one 30 px icon.
export function IconButton({ icon, accessibilityLabel, onPress, onLongPress, delayLongPress, size = 64 }: IconButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      style={[styles.button, { width: size, height: size }]}
    >
      {icon}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    borderWidth: border.normal,
    borderColor: colors.borderNeutral,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
