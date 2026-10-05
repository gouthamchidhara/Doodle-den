// Sun with rays (time pill).
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Sun icon drawn with react-native-svg (A2 Icons).
export function SunIcon({ size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Circle cx={13} cy={13} r={6} fill={colors.sun} />
      <Path d="M13 2v3M13 21v3M2 13h3M21 13h3M5 5l2 2M19 19l2 2M5 21l2-2M19 7l2-2" stroke={colors.sun} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
