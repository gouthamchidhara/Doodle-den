// Coloring Page Maker tile: page with a sparkle.
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Coloring Page Maker tile illustration (A2: stroke 5, ink outlines).
export function ColoringMakerArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={22} y={16} width={66} height={88} rx={8} fill={colors.white} stroke={colors.ink} strokeWidth={5} />
      <Circle cx={55} cy={60} r={18} stroke={colors.ink} strokeWidth={4} />
      <Path d="M92 14l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill={colors.sun} stroke={colors.ink} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
