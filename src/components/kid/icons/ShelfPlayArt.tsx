// Play shelf: ball.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Play shelf illustration (A2: stroke 5, ink outlines).
export function ShelfPlayArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={42} fill={colors.sky} stroke={colors.ink} strokeWidth={6} />
      <Path d="M22 50c26 10 50 10 76 0M60 18c-14 26-14 58 0 84" stroke={colors.white} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}
