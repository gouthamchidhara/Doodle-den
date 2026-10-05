// Neon tool (glowing squiggle).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Neon icon drawn with react-native-svg (A2 Icons).
export function NeonIcon({ size = 42 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path d="M8 28c6-14 12 6 18-8s8 6 8 6" stroke={colors.pink} strokeWidth={7} strokeLinecap="round" strokeOpacity={0.3} />
      <Path d="M8 28c6-14 12 6 18-8s8 6 8 6" stroke={colors.pink} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
