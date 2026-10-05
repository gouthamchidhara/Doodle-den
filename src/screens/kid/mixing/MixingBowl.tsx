// The big mixing bowl: animates to the mix color with a swirl; shows how many blobs are in.
import { forwardRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { border, colors, space } from '@/theme/tokens';

export interface MixingBowlProps {
  color: string | null;
  blobs: number;
  max: number;
  size: number;
}

// Bowl view; the ref is used to measure the drop zone.
export const MixingBowl = forwardRef<View, MixingBowlProps>(function MixingBowl({ color, blobs, max, size }, ref) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
  }, [color, spin]);
  const swirl = useAnimatedStyle(() => ({ opacity: 1 - spin.get(), transform: [{ rotate: `${spin.get() * 540}deg` }] }));
  const paint = useAnimatedStyle(() => ({ backgroundColor: withTiming(color ?? colors.surface, { duration: 700 }) }));

  return (
    <View ref={ref} collapsable={false} style={[styles.bowl, { width: size, height: size, borderRadius: size / 2 }]} accessibilityLabel="Mixing bowl">
      <Animated.View style={[StyleSheet.absoluteFill, styles.paint, { borderRadius: size / 2 }, paint]} />
      {color ? (
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, swirl]}>
          <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100">
            <Path d="M50 50c0-8 12-8 12 0 0 14-24 14-24 0 0-20 36-20 36 0 0 26-48 26-48 0" stroke={colors.white} strokeWidth={6} fill="none" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      ) : null}
      <View style={styles.dots}>
        {Array.from({ length: max }, (_, i) => (
          <View key={i} style={[styles.dot, i < blobs ? styles.full : styles.empty]} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bowl: { backgroundColor: colors.surface, borderWidth: border.thick, borderColor: colors.ink, overflow: 'hidden' },
  paint: { margin: space.md },
  center: { alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: space.lg, alignSelf: 'center', flexDirection: 'row', gap: space.sm },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.ink },
  full: { backgroundColor: colors.ink },
  empty: { backgroundColor: colors.surface },
});
