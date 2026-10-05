// Glitter tool (sparkle).
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Glitter icon drawn with react-native-svg (A2 Icons).
export function GlitterIcon({ size = 42, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path d="M21 6l3 10 10 3-10 3-3 10-3-10-10-3 10-3z" fill={colors.sun} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <Circle cx={33} cy={32} r={3} fill={colors.pink} />
      <Circle cx={9} cy={34} r={2.5} fill={colors.sky} />
    </Svg>
  );
}
