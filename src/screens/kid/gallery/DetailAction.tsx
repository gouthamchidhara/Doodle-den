// Big icon button with a word under it (gallery detail actions).
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/kid/PressableScale';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

export interface DetailActionProps {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  selected?: boolean;
}

// One action.
export function DetailAction({ icon, label, onPress, onLongPress, delayLongPress, selected }: DetailActionProps) {
  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} onLongPress={onLongPress} delayLongPress={delayLongPress} selected={selected} style={[styles.btn, selected && styles.on]}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { minWidth: 96, minHeight: 88, paddingHorizontal: space.sm, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: border.normal, borderColor: colors.borderNeutral, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  on: { backgroundColor: colors.tint.pink.fill, borderColor: colors.pink },
  label: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption, color: colors.ink, textAlign: 'center' },
});
