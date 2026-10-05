// Cloud (offline Magic).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Cloud icon drawn with react-native-svg (A2 Icons).
export function CloudIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M9 23h13a5 5 0 0 0 0-10 7 7 0 0 0-13-1 5.5 5.5 0 0 0 0 11z" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
