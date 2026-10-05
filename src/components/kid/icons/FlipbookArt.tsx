// Flipbook tile: stacked pages with a jumping dot.
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Flipbook tile illustration (A2: stroke 5, ink outlines).
export function FlipbookArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={30} y={18} width={64} height={80} rx={8} fill={colors.tint.sky.fill} stroke={colors.ink} strokeWidth={4} />
      <Rect x={22} y={26} width={64} height={80} rx={8} fill={colors.white} stroke={colors.ink} strokeWidth={5} />
      <Circle cx={54} cy={56} r={12} fill={colors.tomato} stroke={colors.ink} strokeWidth={4} />
      <Path d="M40 86c8-8 20-8 28 0" stroke={colors.sky} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
