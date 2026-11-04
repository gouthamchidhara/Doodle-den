// Local demo car for a fresh racetrack; never stored as child artwork.
import { useSharedValue, useAnimatedStyle, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { playSound } from '@/services/audio';
import { colors } from '@/theme/tokens';

import { carMotion } from './carMotion';
import { spriteParams } from '../spriteParams';

export const SAMPLE_CAR_ID = 'sample-racetrack-car';
const SAMPLE_PARAMS = spriteParams(SAMPLE_CAR_ID);

interface SampleCarProps {
  width: number;
  height: number;
  clock: SharedValue<number>;
  ext: SharedValue<number[]>;
}

export function SampleCar({ width, height, clock, ext }: SampleCarProps) {
  const wiggle = useSharedValue(0);
  const carHeight = height * 0.16;
  const carWidth = carHeight * 1.8;
  const style = useAnimatedStyle(() => {
    const pose = carMotion(clock.get(), SAMPLE_PARAMS, 0, 1, width, height, ext.get());
    return {
      transform: [
        { translateX: pose.x - carWidth / 2 },
        { translateY: pose.y - carHeight / 2 },
        { rotate: `${pose.rotate + wiggle.get() * 12}deg` },
        { scale: pose.scale },
      ],
    };
  });
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      wiggle.set(withSequence(withTiming(1, { duration: 100 }), withTiming(-1, { duration: 100 }), withTiming(0, { duration: 100 })));
      playSound('vroom');
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View accessibilityLabel="Sample car" accessibilityRole="button" style={[styles.car, { width: carWidth, height: carHeight }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 180 100" fill="none">
          <Path d="M20 61l12-27c2-5 7-8 12-8h66c6 0 11 3 14 8l15 27h11c6 0 10 5 10 11v9H18v-9c0-6 2-11 2-11Z" fill={colors.tomato} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
          <Path d="M51 31h28v26H38l10-22c1-2 2-4 3-4Zm37 0h22c4 0 7 2 9 5l12 21H88V31Z" fill={colors.white} stroke={colors.ink} strokeWidth={4} strokeLinejoin="round" />
          <Circle cx={49} cy={78} r={13} fill={colors.ink} />
          <Circle cx={132} cy={78} r={13} fill={colors.ink} />
          <Circle cx={49} cy={78} r={5} fill={colors.white} />
          <Circle cx={132} cy={78} r={5} fill={colors.white} />
          <Rect x={23} y={57} width={9} height={8} rx={3} fill={colors.sun} />
          <Rect x={154} y={57} width={8} height={8} rx={3} fill={colors.sun} />
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = {
  car: { position: 'absolute' as const, left: 0, top: 0 },
};