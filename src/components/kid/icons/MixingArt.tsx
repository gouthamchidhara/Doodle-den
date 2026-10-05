// Mixing Lab tile: blue + yellow make green.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Mixing Lab tile illustration (A2: stroke 5, ink outlines).
export function MixingArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Circle cx={44} cy={58} r={30} fill={colors.sky} fillOpacity={0.85} stroke={colors.ink} strokeWidth={5} />
      <Circle cx={76} cy={58} r={30} fill={colors.sun} fillOpacity={0.85} stroke={colors.ink} strokeWidth={5} />
      <Path d="M60 32a30 30 0 0 1 0 52 30 30 0 0 1 0-52z" fill={colors.leaf} />
      <Path d="M50 104h20" stroke={colors.ink} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
