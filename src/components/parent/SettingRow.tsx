// One parent settings row: label + value link or toggle (A2).
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, touch } from '@/theme/tokens';

export interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  last?: boolean;
}

// 46 pt row with a divider; value shown in link color with a chevron.
export function SettingRow({ label, value, onPress, toggle, last }: SettingRowProps) {
  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      {toggle ? (
        <Switch
          accessibilityLabel={label}
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.leaf, false: colors.borderParent }}
        />
      ) : value !== undefined ? (
        <Text style={styles.value}>{value} ›</Text>
      ) : null}
    </View>
  );
  if (!onPress || toggle) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}${value ? `: ${value}` : ''}`} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: Math.max(46, touch.parent), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { borderBottomWidth: border.thin, borderBottomColor: colors.dividerParent },
  label: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.ink, flexShrink: 1 },
  value: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.link },
});
