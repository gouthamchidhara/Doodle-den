// Racetrack tile: little car.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Racetrack tile illustration (A2: stroke 5, ink outlines).
export function RacetrackArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M14 74h92" stroke={colors.ink} strokeWidth={5} strokeLinecap="round" strokeDasharray="10 10" />
      <Path d="M20 64V50l14-14h40l16 14h12v14z" fill={colors.tomato} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M40 50l8-8h22l8 8z" fill={colors.white} stroke={colors.ink} strokeWidth={4} strokeLinejoin="round" />
      <Circle cx={38} cy={66} r={10} fill={colors.ink} />
      <Circle cx={84} cy={66} r={10} fill={colors.ink} />
    </Svg>
  );
}
