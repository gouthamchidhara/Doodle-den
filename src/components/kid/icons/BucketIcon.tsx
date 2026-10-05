// Paint bucket (fill tool).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Bucket icon drawn with react-native-svg (A2 Icons).
export function BucketIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M6 13l9-9 9 9-9 9z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M6 13h18" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M25 18c1.5 2.2 2 3.5 2 4.5a2 2 0 0 1-4 0c0-1 .5-2.3 2-4.5z" fill={colors.sky} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}
