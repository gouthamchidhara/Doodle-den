// Background color button.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Background icon drawn with react-native-svg (A2 Icons).
export function BackgroundIcon({ size = 32, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={5} y={5} width={22} height={22} rx={6} fill={colors.tint.sky.fill} stroke={color} strokeWidth={3} />
      <Path d="M5 20l7-6 6 5 4-3 5 4" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}
