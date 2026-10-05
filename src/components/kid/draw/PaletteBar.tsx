// Paint colors: 10 palette colors + rainbow + the kid's named custom colors; scrolls sideways when it does not fit.
import { ScrollView, StyleSheet } from 'react-native';

import { drawingPalette, space } from '@/theme/tokens';
import type { CustomColor } from '@/types/models';

import { ColorDot } from '../ColorDot';

export interface PaletteBarProps {
  selected: string;
  onSelect: (color: string) => void;
  custom?: CustomColor[];
  showRainbow?: boolean;
}

// Horizontal color picker; custom colors are stored as their hex.
export function PaletteBar({ selected, onSelect, custom = [], showRainbow = true }: PaletteBarProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {drawingPalette.map((c) => (
        <ColorDot key={c} color={c} selected={selected === c} onPress={() => onSelect(c)} />
      ))}
      {showRainbow ? <ColorDot color="rainbow" selected={selected === 'rainbow'} onPress={() => onSelect('rainbow')} /> : null}
      {custom.map((c) => (
        <ColorDot key={c.id} color={{ hex: c.hex, name: c.name }} selected={selected === c.hex} onPress={() => onSelect(c.hex)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.sm },
});
