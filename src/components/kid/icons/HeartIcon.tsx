// Heart (favorite).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Heart icon drawn with react-native-svg (A2 Icons).
export function HeartIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M15 26S3 19 3 10a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 9-12 16-12 16z" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
