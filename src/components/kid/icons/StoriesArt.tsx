// Stories tile: closed storybook.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Stories tile illustration (A2: stroke 5, ink outlines).
export function StoriesArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={28} y={14} width={64} height={92} rx={8} fill={colors.sun} stroke={colors.ink} strokeWidth={5} />
      <Path d="M40 14v92" stroke={colors.ink} strokeWidth={5} />
      <Path d="M66 46l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill={colors.white} />
    </Svg>
  );
}
