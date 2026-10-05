// Music Paint tile: colorful notes.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Music Paint tile illustration (A2: stroke 5, ink outlines).
export function MusicArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M38 86V30l52-10v56" stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Circle cx={30} cy={86} r={12} fill={colors.grape} stroke={colors.ink} strokeWidth={4} />
      <Circle cx={82} cy={76} r={12} fill={colors.pink} stroke={colors.ink} strokeWidth={4} />
      <Path d="M38 42l52-10" stroke={colors.ink} strokeWidth={5} />
    </Svg>
  );
}
