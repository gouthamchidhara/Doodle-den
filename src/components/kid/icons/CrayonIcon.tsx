// Crayon tool.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Crayon icon drawn with react-native-svg (A2 Icons).
export function CrayonIcon({ size = 42, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path d="M10 32l18-18 4 4-18 18H10z" fill={colors.tomato} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M28 14l4-4 4 4-4 4" fill={colors.sun} stroke={color} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
