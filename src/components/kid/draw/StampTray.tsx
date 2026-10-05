// Picker for the 20 stamps, shown when the stamp tool is selected.
import { ScrollView, StyleSheet } from 'react-native';

import { STAMPS } from '@/canvas/stamps';
import { border, colors, radius, space } from '@/theme/tokens';

import { PressableScale } from '../PressableScale';

import { StampPreview } from './StampPreview';

export interface StampTrayProps {
  selected: string;
  onSelect: (id: string) => void;
}

// Sideways-scrolling stamp choices.
export function StampTray({ selected, onSelect }: StampTrayProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {STAMPS.map((s) => (
        <PressableScale
          key={s.id}
          accessibilityLabel={s.label}
          selected={selected === s.id}
          sound="tool-select"
          onPress={() => onSelect(s.id)}
          style={[styles.cell, selected === s.id ? styles.on : styles.off]}
        >
          <StampPreview id={s.id} />
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingHorizontal: space.sm, alignItems: 'center' },
  cell: { width: 60, height: 60, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
});
