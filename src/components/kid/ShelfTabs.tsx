// Row of five big shelf tabs on Kid Home; tapping speaks the shelf name (A5).
import { StyleSheet, Text, View } from 'react-native';

import { SHELVES, type ShelfKey } from '@/content/activities';
import { say } from '@/services/voice';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { PressableScale } from './PressableScale';

export interface ShelfTabsProps {
  selected: ShelfKey;
  onSelect: (shelf: ShelfKey) => void;
}

// Selected tab = tint fill + 4 px border.
export function ShelfTabs({ selected, onSelect }: ShelfTabsProps) {
  const { isTablet } = useLayout();
  return (
    <View style={styles.row}>
      {SHELVES.map((s) => {
        const on = s.key === selected;
        const t = colors.tint[s.tint];
        return (
          <PressableScale
            key={s.key}
            accessibilityLabel={s.title}
            selected={on}
            onPress={() => {
              say(s.voice);
              onSelect(s.key);
            }}
            style={[
              styles.tab,
              { height: isTablet ? 64 : 56, paddingHorizontal: isTablet ? space.lg : space.sm },
              on ? { backgroundColor: t.fill, borderColor: t.border, borderWidth: border.thick } : styles.off,
            ]}
          >
            <s.Art size={isTablet ? 36 : 30} />
            {isTablet || on ? <Text style={styles.label}>{s.title}</Text> : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: radius.pill, minWidth: 56 },
  off: { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: border.normal },
  label: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
});
