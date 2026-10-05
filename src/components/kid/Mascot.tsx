// Red crayon mascot with four moods: idle, happy, sleepy, sleeping (A2).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, fonts } from '@/theme/tokens';

export type MascotMood = 'idle' | 'happy' | 'sleepy' | 'sleeping';

export interface MascotProps {
  mood: MascotMood;
  size?: number;
}

const YAWN_EVERY_MS = 4000;
const YAWN_MS = 1200;

// Face parts for each mood (eyes + mouth), drawn in the 110x110 mascot box.
function Face({ mood, yawning }: { mood: MascotMood; yawning: boolean }) {
  if (mood === 'sleeping') {
    return (
      <>
        <Path d="M41 55h10M59 55h10" stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
        <Path d="M48 72c4 3 10 3 14 0" stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
      </>
    );
  }
  if (mood === 'sleepy') {
    return (
      <>
        <Path d="M41 54a5 5 0 0 0 10 0M59 54a5 5 0 0 0 10 0" stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
        {yawning ? (
          <Circle cx={55} cy={73} r={6} fill={colors.ink} />
        ) : (
          <Path d="M48 72c4 3 10 3 14 0" stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
        )}
      </>
    );
  }
  return (
    <>
      <Circle cx={46} cy={54} r={5} fill={colors.ink} />
      <Circle cx={64} cy={54} r={5} fill={colors.ink} />
      <Path
        d={mood === 'happy' ? 'M43 68c6 10 18 10 24 0' : 'M45 70c6 6 14 6 20 0'}
        stroke={colors.ink}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </>
  );
}

// Animated mascot; motion depends on mood.
export function Mascot({ mood, size = 110 }: MascotProps) {
  const y = useSharedValue(0);
  const z = useSharedValue(0);
  const [yawning, setYawning] = useState(false);

  useEffect(() => {
    cancelAnimation(y);
    y.set(0);
    if (mood === 'idle') {
      y.set(withRepeat(withSequence(withTiming(-6, { duration: 1000, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })), -1));
    } else if (mood === 'happy') {
      y.set(withRepeat(withSequence(withTiming(-24, { duration: 220, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 600 })), -1));
    }
    cancelAnimation(z);
    z.set(0);
    if (mood === 'sleeping') z.set(withRepeat(withTiming(1, { duration: 2400 }), -1));
  }, [mood, y, z]);

  useEffect(() => {
    if (mood !== 'sleepy') return undefined;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      setYawning(true);
      hide = setTimeout(() => setYawning(false), YAWN_MS);
    }, YAWN_EVERY_MS);
    return () => {
      clearInterval(timer);
      if (hide) clearTimeout(hide);
      setYawning(false);
    };
  }, [mood]);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const zStyle = useAnimatedStyle(() => ({ opacity: 1 - z.get(), transform: [{ translateY: -20 * z.get() }] }));

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="Crayon friend">
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Svg width={size} height={size} viewBox="0 0 110 110" fill="none">
          <Rect x={30} y={10} width={50} height={92} rx={16} fill={colors.tomato} stroke={colors.ink} strokeWidth={5} />
          <Path d="M30 30h50" stroke={colors.ink} strokeWidth={5} />
          <Path d="M38 10l17-8 17 8" fill={colors.sun} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
          <Face mood={mood} yawning={yawning} />
        </Svg>
      </Animated.View>
      {mood === 'sleeping' ? (
        <Animated.Text style={[styles.z, { fontSize: size * 0.2, right: 0, top: 0 }, zStyle]}>z z</Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  z: { position: 'absolute', fontFamily: fonts.display, color: colors.inkMuted },
});
