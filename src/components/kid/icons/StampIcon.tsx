// Stamps tool (heart).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Stamp icon drawn with react-native-svg (A2 Icons).
export function StampIcon({ size = 42, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path d="M21 34s-12-7-12-16a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 9-12 16-12 16z" fill={colors.tomato} stroke={color} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
