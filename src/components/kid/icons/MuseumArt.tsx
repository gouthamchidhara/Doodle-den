// Museum Night tile: frame under a spotlight.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Museum Night tile illustration (A2: stroke 5, ink outlines).
export function MuseumArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M60 8L36 52h48z" fill={colors.moon} fillOpacity={0.8} />
      <Rect x={30} y={50} width={60} height={50} rx={6} fill={colors.white} stroke={colors.ink} strokeWidth={5} />
      <Path d="M38 90l14-16 10 10 8-8 12 14z" fill={colors.grape} stroke={colors.ink} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
