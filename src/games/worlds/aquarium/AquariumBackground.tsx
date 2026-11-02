// Aquarium scene (mockup "Draw-to-Life Aquarium · iPad"): water, wave band, sand, seaweed, pebbles, rising bubbles.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const BUBBLES = [
  [0.25, 9],
  [0.27, 6],
  [0.72, 12],
  [0.74, 7],
  [0.52, 9],
] as const;

// One bubble rising from the sand to the surface, looping.
function Bubble({ x, r, height, delay }: { x: number; r: number; height: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 6000 + delay, easing: Easing.linear }), -1));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -((t.get() + delay / 7000) % 1) * height * 0.8 }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.bubble, { left: x - r, top: height * 0.85 - r, width: r * 2, height: r * 2, borderRadius: r }, style]} />
  );
}

// Static painted background + animated bubbles, sized to the scene.
export function AquariumBackground({ width: w, height: h }: { width: number; height: number }) {
  const sy = h / 834;
  const sx = w / 1194;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h} viewBox="0 0 1194 834" preserveAspectRatio="none">
        <Path d="M0 0h1194v834H0z" fill={colors.water} />
        <Path d="M0 60c100-24 200 24 300 0s200-24 300 0 200 24 300 0 200-24 294 0V0H0z" fill={colors.waterLight} />
        <Path d="M0 700c120-30 260 20 400 0s300-30 420-6 260 20 374 0v140H0z" fill={colors.sand} />
        <Path d="M80 720c-10-60 20-90 0-160s24-80 10-130" stroke={colors.leaf} strokeWidth={16} strokeLinecap="round" fill="none" />
        <Path d="M130 726c10-50-16-80 4-130" stroke={colors.leaf} strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.8} />
        <Path d="M1060 720c12-70-18-100 4-170s-14-70 0-110" stroke={colors.leaf} strokeWidth={16} strokeLinecap="round" fill="none" />
        <Circle cx={980} cy={740} r={26} fill={colors.orange} stroke={colors.ink} strokeWidth={4} />
        <Circle cx={340} cy={752} r={18} fill={colors.pink} stroke={colors.ink} strokeWidth={4} />
      </Svg>
      {BUBBLES.map(([x, r], i) => (
        <Bubble key={i} x={x * w} r={r * Math.min(sx, sy) * 1.4} height={h} delay={i * 1300} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', borderWidth: 3, borderColor: colors.white, opacity: 0.8 },
});
