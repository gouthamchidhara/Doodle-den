// Check mark (done buttons).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Check icon drawn with react-native-svg (A2 Icons).
export function CheckIcon({ size = 26, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Path d="M5 13l6 6 10-12" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
