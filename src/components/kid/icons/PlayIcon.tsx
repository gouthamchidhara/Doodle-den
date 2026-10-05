// Play triangle.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Play icon drawn with react-native-svg (A2 Icons).
export function PlayIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M9 5l16 10-16 10z" fill={color} stroke={color} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
