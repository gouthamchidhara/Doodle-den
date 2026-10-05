// Short sparkle burst played when a drawing is saved ("I'm done!").
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const STAR = 'M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z';
const COUNT = 10;

// One star flying out from the center.
function Star({ index, radius }: { index: number; radius: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [t]);
  const angle = (index / COUNT) * Math.PI * 2;
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.get(),
    transform: [{ translateX: Math.cos(angle) * radius * t.get() }, { translateY: Math.sin(angle) * radius * t.get() }, { scale: 0.6 + t.get() }],
  }));
  return (
    <Animated.View style={[styles.star, style]}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d={STAR} fill={index % 2 === 0 ? colors.sun : colors.pink} />
      </Svg>
    </Animated.View>
  );
}

// Burst of stars centered in its parent; remount (change key) to replay.
export function SparkleBurst({ radius = 160 }: { radius?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Star key={i} index={i} radius={radius} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute' },
});
