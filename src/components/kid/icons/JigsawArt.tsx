// Jigsaw tile: puzzle piece.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Jigsaw tile illustration (A2: stroke 5, ink outlines).
export function JigsawArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M24 28h24a10 10 0 1 1 20 0h24v24a10 10 0 1 0 0 20v24H68a10 10 0 1 0-20 0H24z" fill={colors.orange} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
    </Svg>
  );
}
