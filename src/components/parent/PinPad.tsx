// 4-digit PIN entry: dots + number pad; shakes on error (parent gate + onboarding).
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

export interface PinPadProps {
  onComplete: (pin: string) => void;
  shakeKey?: number;
  disabled?: boolean;
  length?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

// Dots for entered digits and a 3x4 pad; calls onComplete when all digits are in.
export function PinPad({ onComplete, shakeKey = 0, disabled, length = 4 }: PinPadProps) {
  const [digits, setDigits] = useState('');
  const x = useSharedValue(0);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  useEffect(() => {
    if (shakeKey === 0) return;
    x.set(withSequence(withTiming(-12, { duration: 50 }), withTiming(12, { duration: 80 }), withTiming(-8, { duration: 80 }), withTiming(0, { duration: 60 })));
  }, [shakeKey, x]);

  const press = (k: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (k === 'del') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (!k) return;
    const next = (digits + k).slice(0, length);
    setDigits(next);
    if (next.length === length) {
      setDigits('');
      onComplete(next);
    }
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dots, shake]} accessibilityLabel={`${digits.length} of ${length} digits entered`}>
        {Array.from({ length }, (_, i) => (
          <View key={i} style={[styles.dot, i < digits.length && styles.dotOn]} />
        ))}
      </Animated.View>
      <View style={styles.pad}>
        {KEYS.map((k, i) =>
          k ? (
            <Pressable
              key={`${k}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? 'Delete' : k}
              disabled={disabled}
              onPress={() => press(k)}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed, disabled && { opacity: 0.4 }]}
            >
              <Text style={styles.keyText}>{k === 'del' ? '⌫' : k}</Text>
            </Pressable>
          ) : (
            <View key={`blank-${i}`} style={styles.blank} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.xl },
  dots: { flexDirection: 'row', gap: space.lg },
  dot: { width: 18, height: 18, borderRadius: radius.round, borderWidth: border.normal - 1, borderColor: colors.ink },
  dotOn: { backgroundColor: colors.ink },
  pad: { width: 252, flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'center' },
  key: {
    width: 72,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: border.thin,
    borderColor: colors.borderParent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: colors.dividerParent },
  blank: { width: 72, height: 64 },
  keyText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.title, color: colors.ink },
});
