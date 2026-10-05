// Watercolor tool (drop).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Watercolor icon drawn with react-native-svg (A2 Icons).
export function WatercolorIcon({ size = 42, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path d="M21 6c6 9 10 14 10 20a10 10 0 0 1-20 0c0-6 4-11 10-20z" fill={colors.grape} fillOpacity={0.6} stroke={color} strokeWidth={3} />
    </Svg>
  );
}
