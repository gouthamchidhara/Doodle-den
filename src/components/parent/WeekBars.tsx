// Seven-day play-time bars for the parent dashboard (A2).
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, space } from '@/theme/tokens';

export interface WeekDay {
  label: string;
  minutes: number;
  isToday: boolean;
}

export interface WeekBarsProps {
  days: WeekDay[];
}

const MAX_H = 52;
const MIN_H = 4;

// Bar height for a value relative to the week's max.
export function barHeight(minutes: number, max: number): number {
  if (max <= 0 || minutes <= 0) return MIN_H;
  return Math.max(MIN_H, Math.round((minutes / max) * MAX_H));
}

// 7 rounded bars; today's bar uses the darker blue.
export function WeekBars({ days }: WeekBarsProps) {
  const max = Math.max(0, ...days.map((d) => d.minutes));
  return (
    <View style={styles.row}>
      {days.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.col} accessibilityLabel={`${d.label}: ${Math.round(d.minutes)} minutes`}>
          <View
            style={[
              styles.bar,
              {
                height: barHeight(d.minutes, max),
                backgroundColor: d.minutes <= 0 ? colors.chartTrack : d.isToday ? colors.chartBarToday : colors.chartBar,
              },
            ]}
          />
          <Text style={[styles.label, d.isToday && { color: colors.ink }]}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: MAX_H + 22, paddingHorizontal: space.xs },
  col: { alignItems: 'center', gap: 6 },
  bar: { width: 28, borderRadius: 8 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption - 1, color: colors.inkMuted },
});
