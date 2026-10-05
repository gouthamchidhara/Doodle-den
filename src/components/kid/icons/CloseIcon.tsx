// Close / cancel cross.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Close icon drawn with react-native-svg (A2 Icons).
export function CloseIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M7 7l16 16M23 7L7 23" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
