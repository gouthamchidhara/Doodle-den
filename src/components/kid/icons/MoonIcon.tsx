// Crescent moon (sleepy time pill).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Moon icon drawn with react-native-svg (A2 Icons).
export function MoonIcon({ size = 26, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Path d="M15 3a10 10 0 1 0 9 13 8 8 0 1 1-9-13z" fill={colors.moon} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}
