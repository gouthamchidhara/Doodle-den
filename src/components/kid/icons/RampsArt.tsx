// Ramps & Rollers tile: ball on a slide.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Ramps & Rollers tile illustration (A2: stroke 5, ink outlines).
export function RampsArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M12 36c30 0 46 50 96 54" stroke={colors.leaf} strokeWidth={9} strokeLinecap="round" />
      <Circle cx={30} cy={24} r={11} fill={colors.tomato} stroke={colors.ink} strokeWidth={4} />
      <Path d="M86 92h24v18H86z" fill={colors.sun} stroke={colors.ink} strokeWidth={4} strokeLinejoin="round" />
    </Svg>
  );
}
