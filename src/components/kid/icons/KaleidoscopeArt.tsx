// Kaleidoscope tile: four petals.
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Kaleidoscope tile illustration (A2: stroke 5, ink outlines).
export function KaleidoscopeArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Ellipse cx={60} cy={32} rx={12} ry={22} fill={colors.pink} stroke={colors.ink} strokeWidth={4} />
      <Ellipse cx={60} cy={88} rx={12} ry={22} fill={colors.pink} stroke={colors.ink} strokeWidth={4} />
      <Ellipse cx={32} cy={60} rx={22} ry={12} fill={colors.grape} stroke={colors.ink} strokeWidth={4} />
      <Ellipse cx={88} cy={60} rx={22} ry={12} fill={colors.grape} stroke={colors.ink} strokeWidth={4} />
      <Circle cx={60} cy={60} r={12} fill={colors.sun} stroke={colors.ink} strokeWidth={4} />
    </Svg>
  );
}
