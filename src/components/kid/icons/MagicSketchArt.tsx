// Magic Sketch tile: wand over a doodle.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Magic Sketch tile illustration (A2: stroke 5, ink outlines).
export function MagicSketchArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M16 86c10-18 20 8 30-10s14 8 18 2" stroke={colors.pink} strokeWidth={6} strokeLinecap="round" />
      <Path d="M54 98l46-46" stroke={colors.ink} strokeWidth={7} strokeLinecap="round" />
      <Path d="M100 14l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill={colors.sun} stroke={colors.ink} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
