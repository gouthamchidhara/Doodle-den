// Aquarium tile: fish with bubbles.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Aquarium tile illustration (A2: stroke 5, ink outlines).
export function AquariumArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M18 60c16-26 52-30 72 0-20 30-56 26-72 0z" fill={colors.sky} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M90 60l20-18v36z" fill={colors.sun} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Circle cx={40} cy={54} r={5} fill={colors.ink} />
      <Path d="M56 46c6 8 6 20 0 28" stroke={colors.white} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={30} cy={22} r={6} stroke={colors.sky} strokeWidth={4} />
      <Circle cx={44} cy={12} r={4} stroke={colors.sky} strokeWidth={3} />
    </Svg>
  );
}
