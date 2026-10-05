// AR Wall tile: drawing floating on a wall.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// AR Wall tile illustration (A2: stroke 5, ink outlines).
export function ArWallArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M14 100h92M20 100V22h80v78" stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
      <Rect x={38} y={36} width={44} height={40} rx={6} fill={colors.white} stroke={colors.ink} strokeWidth={5} transform="rotate(-6 60 56)" />
      <Path d="M46 64c6-10 12 4 18-6s8 4 10 2" stroke={colors.tomato} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}
