// While Magic works (A7): full-screen mascot stirring a paint pot, a soft loop, a big Cancel. No percentages.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { loopSound } from '@/services/audio';
import { colors, overlays, space } from '@/theme/tokens';

import { Mascot } from './Mascot';
import { PrimaryButton } from './PrimaryButton';

// Waiting overlay; `onCancel` abandons the request (its result is ignored).
export function MagicWaiting({ onCancel }: { onCancel: () => void }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1));
    const stop = loopSound('magic-loop', 0.4);
    return stop;
  }, [spin]);
  const stir = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(spin.get() * Math.PI * 2) * 25}deg` }] }));
  return (
    <View style={[StyleSheet.absoluteFill, styles.dim]} accessibilityLabel="Magic is working">
      <View style={styles.row}>
        <Mascot mood="happy" size={140} />
        <View>
          <Animated.View style={[styles.spoon, stir]}>
            <Svg width={60} height={120} viewBox="0 0 60 120">
              <Path d="M30 0v90" stroke={colors.brown} strokeWidth={8} strokeLinecap="round" />
            </Svg>
          </Animated.View>
          <Svg width={160} height={110} viewBox="0 0 160 110">
            <Path d="M10 30h140l-14 70H24z" fill={colors.grape} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
            <Ellipse cx={80} cy={30} rx={70} ry={14} fill={colors.pink} stroke={colors.ink} strokeWidth={5} />
          </Svg>
        </View>
      </View>
      <PrimaryButton label="Cancel" tone="tomato" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: overlays.scrim, alignItems: 'center', justifyContent: 'center', gap: space.xxl },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.lg },
  spoon: { position: 'absolute', left: 60, top: -70, zIndex: 2 },
});
