// Magic wand.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Wand icon drawn with react-native-svg (A2 Icons).
export function WandIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M5 25L19 11" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 3l1.5 3.5L27 8l-3.5 1.5L22 13l-1.5-3.5L17 8l3.5-1.5z" fill={colors.sun} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}
