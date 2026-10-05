// One moving creature: its drawing as an image, posed every frame by the world's motion worklet; tap + long-press.
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import type { Creature, MotionFn } from './types';

export interface SpriteProps {
  creature: Creature;
  index: number;
  count: number;
  clock: SharedValue<number>;
  ext: SharedValue<number[]>;
  motion: MotionFn;
  width: number;
  height: number;
  spriteH: number;
  showName: boolean;
  entering: boolean;
  onTap: (c: Creature) => void;
  onLongPress: (c: Creature) => void;
}

const LONG_PRESS_MS = 1000;

// Sprite view.
export function Sprite({ creature, index, count, clock, ext, motion, width, height, spriteH, showName, entering, onTap, onLongPress }: SpriteProps) {
  const [aspect, setAspect] = useState(1);
  const wiggle = useSharedValue(0);
  const enter = useSharedValue(entering ? 0 : 1);
  useEffect(() => {
    if (entering) enter.set(withSpring(1, { damping: 8 }));
  }, [entering, enter]);
  const w = spriteH * aspect;

  const style = useAnimatedStyle(() => {
    const pose = motion(clock.get(), creature.params, index, count, width, height, ext.get());
    return {
      transform: [
        { translateX: pose.x - w / 2 },
        { translateY: pose.y - spriteH / 2 },
        { rotate: `${pose.rotate + wiggle.get() * 12}deg` },
        { scale: pose.scale * enter.get() },
      ],
    };
  });
  const flipStyle = useAnimatedStyle(() => {
    const pose = motion(clock.get(), creature.params, index, count, width, height, ext.get());
    return { transform: [{ scaleX: pose.flip ? -1 : 1 }] };
  });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      wiggle.set(withSequence(withTiming(1, { duration: 100 }), withTiming(-1, { duration: 100 }), withTiming(1, { duration: 100 }), withTiming(0, { duration: 100 })));
      onTap(creature);
    });
  const hold = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .runOnJS(true)
    .onStart(() => onLongPress(creature));

  return (
    <GestureDetector gesture={Gesture.Exclusive(hold, tap)}>
      <Animated.View style={[styles.sprite, { width: w, height: spriteH }, style]} accessibilityRole="button" accessibilityLabel={creature.entity.name ?? 'My creature'}>
        <Animated.View style={flipStyle}>
          <Image
            source={{ uri: creature.uri }}
            style={{ width: w, height: spriteH }}
            resizeMode="contain"
            onLoad={(e) => {
              const { width: iw, height: ih } = e.nativeEvent.source;
              if (iw > 0 && ih > 0) setAspect(iw / ih);
            }}
          />
        </Animated.View>
        {showName && creature.entity.name ? (
          <View style={styles.label}>
            <Text style={styles.labelText}>{creature.entity.name}</Text>
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute', left: 0, top: 0 },
  label: { position: 'absolute', top: -space.xl, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radius.chip, paddingHorizontal: space.sm, paddingVertical: 2 },
  labelText: { fontFamily: fonts.display, fontSize: fontSize.label, color: colors.ink },
});
