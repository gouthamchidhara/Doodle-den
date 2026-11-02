// Food dots that sprinkle down from the top to the feeding spot.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

const OFFSETS = [-30, -12, 0, 14, 28, -20, 20];

// One falling dot.
function Dot({ x, y, dx, i }: { x: number; y: number; dx: number; i: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 1400 + i * 120, easing: Easing.out(Easing.quad) }));
  }, [t, i]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: t.get() * (y + (i % 3) * 10) }], opacity: 1 - Math.max(0, t.get() - 0.8) * 2 }));
  return <Animated.View style={[styles.dot, { left: x + dx - 6 }, style]} />;
}

// Dots for one feeding (remount with a new key per feed).
export function FoodDots({ x, y }: { x: number; y: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {OFFSETS.map((dx, i) => (
        <Dot key={i} x={x} y={y} dx={dx} i={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.orange, borderWidth: 2, borderColor: colors.ink },
});
