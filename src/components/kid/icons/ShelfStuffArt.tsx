// My Stuff shelf: heart frame.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// My Stuff shelf illustration (A2: stroke 5, ink outlines).
export function ShelfStuffArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={16} y={20} width={88} height={80} rx={12} fill={colors.white} stroke={colors.ink} strokeWidth={6} />
      <Path d="M60 86S36 72 36 54a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 18-24 32-24 32z" fill={colors.pink} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
    </Svg>
  );
}
