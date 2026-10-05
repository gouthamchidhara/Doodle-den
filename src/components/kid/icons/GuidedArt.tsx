// Guided Drawing tile: ghost circle with pencil.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Guided Drawing tile illustration (A2: stroke 5, ink outlines).
export function GuidedArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Circle cx={54} cy={56} r={32} stroke={colors.grape} strokeWidth={6} strokeDasharray="6 10" strokeLinecap="round" />
      <Path d="M54 24a32 32 0 0 1 32 32" stroke={colors.ink} strokeWidth={6} strokeLinecap="round" />
      <Path d="M84 60l20 20-10 10-20-20z" fill={colors.sun} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
    </Svg>
  );
}
