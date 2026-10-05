// S / M / L brush size buttons (Little mode shows only M and L).
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';

import { BrushSizeButton, type BrushSize } from '../BrushSizeButton';

export interface SizePickerProps {
  sizes: BrushSize[];
  selected: BrushSize;
  onSelect: (s: BrushSize) => void;
  horizontal?: boolean;
}

// Biggest size first, as in the mockup rail.
export function SizePicker({ sizes, selected, onSelect, horizontal }: SizePickerProps) {
  const ordered = (['L', 'M', 'S'] as const).filter((s) => sizes.includes(s));
  return (
    <View style={horizontal ? styles.row : styles.col}>
      {ordered.map((s) => (
        <BrushSizeButton key={s} size={s} selected={selected === s} onPress={() => onSelect(s)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  col: { alignItems: 'center', gap: space.lg },
});
