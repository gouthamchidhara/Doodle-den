// Parent-zone button, primary (ink) or secondary (outlined) (A2).
import { Pressable, StyleSheet, Text } from 'react-native';

import { border, colors, fonts, fontSize, space } from '@/theme/tokens';

export interface ParentButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// 48 pt button with radius 14.
export function ParentButton({ label, onPress, variant = 'primary', disabled }: ParentButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.text, { color: primary ? colors.white : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.surface, borderWidth: border.thin, borderColor: colors.borderNeutral },
  text: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label },
});
