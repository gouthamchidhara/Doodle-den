// Shared kid press feedback: scale to 0.94 over 120 ms, light haptic, tap sound (A2).
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { playSound, type SoundName } from '@/services/audio';
import { motion } from '@/theme/tokens';

export interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  accessibilityLabel: string;
  sound?: SoundName | null;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Wraps any kid control with the standard press animation, haptic and sound.
export function PressableScale({
  children,
  onPress,
  onLongPress,
  delayLongPress,
  accessibilityLabel,
  sound = 'tap',
  disabled,
  selected,
  style,
  testID,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (sound) playSound(sound);
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled}
      testID={testID}
      onPressIn={() => scale.set(withTiming(motion.tapScale, { duration: motion.tapMs }))}
      onPressOut={() => scale.set(withTiming(1, { duration: motion.tapMs }))}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
