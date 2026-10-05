// Brush size picker button: S / M / L ink dot in a circle (A2).
import { StyleSheet, View } from 'react-native';

import { border, colors, radius } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

export type BrushSize = 'S' | 'M' | 'L';

const DOT: Record<BrushSize, number> = { S: 10, M: 22, L: 36 };
const LABEL: Record<BrushSize, string> = { S: 'Small brush', M: 'Medium brush', L: 'Big brush' };

export interface BrushSizeButtonProps {
  size: BrushSize;
  selected: boolean;
  onPress?: () => void;
}

// 64 px circle; selected = tomato border + tomato tint fill.
export function BrushSizeButton({ size, selected, onPress }: BrushSizeButtonProps) {
  return (
    <PressableScale
      accessibilityLabel={LABEL[size]}
      selected={selected}
      sound="tool-select"
      onPress={onPress}
      style={[styles.button, selected ? styles.selected : styles.unselected]}
    >
      <View style={{ width: DOT[size], height: DOT[size], borderRadius: radius.round, backgroundColor: colors.ink }} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { width: 64, height: 64, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  unselected: { backgroundColor: colors.surface, borderWidth: border.normal, borderColor: colors.borderNeutral },
  selected: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
});
