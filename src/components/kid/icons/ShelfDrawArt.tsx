// Draw shelf: crayon.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Draw shelf illustration (A2: stroke 5, ink outlines).
export function ShelfDrawArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M24 96l56-56 14 14-56 56H24z" fill={colors.tomato} stroke={colors.ink} strokeWidth={6} strokeLinejoin="round" />
      <Path d="M80 40l12-12 14 14-12 12" fill={colors.sun} stroke={colors.ink} strokeWidth={6} strokeLinejoin="round" />
    </Svg>
  );
}
