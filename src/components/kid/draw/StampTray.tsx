// Picker for the 20 stamps (+ earned bonus stamps), shown when the stamp tool is selected.
import { Image, ScrollView, StyleSheet } from 'react-native';

import { BONUS_STAMPS, STAMPS } from '@/canvas/stamps';
import { border, colors, radius, space } from '@/theme/tokens';

import { PressableScale } from '../PressableScale';

import { StampPreview } from './StampPreview';

export interface StampTrayProps {
  selected: string;
  onSelect: (id: string) => void;
  bonus?: string[];
  art?: { stampId: string; uri: string }[];
}

// Sideways-scrolling stamp choices.
export function StampTray({ selected, onSelect, bonus = [], art = [] }: StampTrayProps) {
  const list = [...STAMPS, ...BONUS_STAMPS.filter((b) => bonus.includes(b.id))];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {list.map((s) => (
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
      {art.map((a) => (
        <PressableScale
          key={a.stampId}
          accessibilityLabel="My sticker"
          selected={selected === a.stampId}
          sound="tool-select"
          onPress={() => onSelect(a.stampId)}
          style={[styles.cell, selected === a.stampId ? styles.on : styles.off]}
        >
          <Image source={{ uri: a.uri }} style={styles.art} resizeMode="contain" />
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingHorizontal: space.sm, alignItems: 'center' },
  cell: { width: 60, height: 60, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  art: { width: 48, height: 48 },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
});
