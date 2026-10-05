// Coloring tile: half-colored star.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Coloring tile illustration (A2: stroke 5, ink outlines).
export function ColoringArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M60 12l14 30 32 4-24 22 7 32-29-16-29 16 7-32-24-22 32-4z" fill={colors.white} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M60 12l14 30 32 4-24 22 7 32-29-16z" fill={colors.sun} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
    </Svg>
  );
}
