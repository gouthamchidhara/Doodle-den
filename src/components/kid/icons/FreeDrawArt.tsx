// Free Draw tile: squiggle + crayon.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Free Draw tile illustration (A2: stroke 5, ink outlines).
export function FreeDrawArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M14 80c14-28 26 10 40-14s26 8 40-12" stroke={colors.tomato} strokeWidth={9} strokeLinecap="round" />
      <Path d="M78 20l22 22-40 40-26 6 6-26z" fill={colors.sun} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M72 26l22 22" stroke={colors.ink} strokeWidth={5} />
    </Svg>
  );
}
