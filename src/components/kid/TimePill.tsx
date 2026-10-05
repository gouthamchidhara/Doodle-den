// Soft "minutes of play left" pill; turns sleepy under 5 minutes, never red (A2).
import { StyleSheet, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';

export interface TimePillProps {
  minutesLeft: number;
}

const SLEEPY_UNDER_MIN = 5;

// Text shown in the pill for a number of whole minutes left.
export function timePillText(minutesLeft: number): string {
  return minutesLeft < SLEEPY_UNDER_MIN ? 'Getting sleepy…' : `${Math.floor(minutesLeft)} min of play left`;
}

// White pill with a sun (or moon when sleepy) and the time text.
export function TimePill({ minutesLeft }: TimePillProps) {
  const sleepy = minutesLeft < SLEEPY_UNDER_MIN;
  const text = timePillText(minutesLeft);
  return (
    <View style={styles.pill} accessibilityRole="text" accessibilityLabel={text}>
      {sleepy ? <MoonIcon /> : <SunIcon />}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: border.normal,
    borderColor: colors.borderSoft,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  text: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body, color: colors.ink },
});
