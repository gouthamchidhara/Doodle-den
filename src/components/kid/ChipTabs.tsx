// Row of big rounded tabs (Trace picker, Gallery filters).
import { StyleSheet, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

export interface ChipTabsProps<K extends string> {
  tabs: { key: K; label: string }[];
  selected: K;
  onSelect: (key: K) => void;
}

// Selected tab = tomato tint, others white.
export function ChipTabs<K extends string>({ tabs, selected, onSelect }: ChipTabsProps<K>) {
  return (
    <View style={styles.row}>
      {tabs.map((t) => (
        <PressableScale
          key={t.key}
          accessibilityLabel={t.label}
          selected={selected === t.key}
          onPress={() => onSelect(t.key)}
          style={[styles.chip, selected === t.key ? styles.on : styles.off]}
        >
          <Text style={styles.text}>{t.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  chip: { minHeight: 56, paddingHorizontal: space.xl, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surface, borderWidth: border.normal, borderColor: colors.borderSoft },
  text: { fontFamily: fonts.display, fontSize: fontSize.body + 2, color: colors.ink },
});
