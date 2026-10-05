// Paint pot the kid drags a blob from (tap also adds a blob). Reports where the blob was dropped.
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts, fontSize, space } from '@/theme/tokens';

import { RainbowDot } from './RainbowDot';

export interface PaintPotProps {
  label: string;
  hex: string | 'mine';
  size: number;
  onDrop: (absX: number, absY: number) => void;
  onTap: () => void;
}

// One pot with a draggable blob on top.
export function PaintPot({ label, hex, size, onDrop, onTap }: PaintPotProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const drag = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      x.set(e.translationX);
      y.set(e.translationY);
    })
    .onEnd((e) => onDrop(e.absoluteX, e.absoluteY))
    .onFinalize(() => {
      x.set(withSpring(0));
      y.set(withSpring(0));
    });
  const tap = Gesture.Tap().runOnJS(true).onEnd(onTap).withTestId(`pot-${label}`);
  const blobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }] }));
  const blob = size * 0.5;

  return (
    <GestureDetector gesture={Gesture.Exclusive(drag, tap)}>
      <View style={[styles.wrap, { width: size }]} accessibilityRole="button" accessibilityLabel={label}>
        <Animated.View style={[styles.blob, { width: blob, height: blob, borderRadius: blob / 2 }, blobStyle]}>
          {hex === 'mine' ? <RainbowDot size={blob} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: hex, borderRadius: blob / 2 }]} />}
        </Animated.View>
        <Svg width={size} height={size * 0.7} viewBox="0 0 100 70">
          <Path d="M10 10h80l-8 52a8 8 0 0 1-8 7H26a8 8 0 0 1-8-7z" fill={colors.surface} stroke={colors.ink} strokeWidth={4} strokeLinejoin="round" />
        </Svg>
        <Text style={styles.label}>{label}</Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.xs },
  blob: { borderWidth: 3, borderColor: colors.ink, overflow: 'hidden', zIndex: 2, marginBottom: -12 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.ink },
});
