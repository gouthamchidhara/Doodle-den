// Parent stepper: − value + with min/max/step, optional wrap-around (used for times).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, space, touch } from '@/theme/tokens';

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  wrap?: boolean;
}

// Next value after a step, clamped or wrapped into [min, max].
export function stepValue(value: number, delta: number, min: number, max: number, wrap = false): number {
  const next = value + delta;
  if (wrap) {
    const span = max - min + Math.abs(delta);
    return ((((next - min) % span) + span) % span) + min;
  }
  return Math.min(max, Math.max(min, next));
}

// Row with a label and −/+ buttons around the formatted value.
export function Stepper({ label, value, min, max, step, onChange, format = String, wrap }: StepperProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Less ${label}`}
          onPress={() => onChange(stepValue(value, -step, min, max, wrap))}
          style={styles.btn}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value} accessibilityLabel={`${label}: ${format(value)}`}>
          {format(value)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`More ${label}`}
          onPress={() => onChange(stepValue(value, step, min, max, wrap))}
          style={styles.btn}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, minHeight: 56 },
  label: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.ink, flexShrink: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  btn: {
    width: touch.parent,
    height: touch.parent,
    borderRadius: 14,
    borderWidth: border.thin,
    borderColor: colors.borderNeutral,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.title, color: colors.ink },
  value: { minWidth: 84, textAlign: 'center', fontFamily: fonts.bodyHeavy, fontSize: fontSize.body, color: colors.ink },
});
