// Zoo tile: smiling giraffe head.
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Zoo tile illustration (A2: stroke 5, ink outlines).
export function ZooArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M46 104V50" stroke={colors.sun} strokeWidth={16} strokeLinecap="round" />
      <Ellipse cx={60} cy={42} rx={26} ry={20} fill={colors.sun} stroke={colors.ink} strokeWidth={5} />
      <Path d="M48 24l-4-12M70 24l4-12" stroke={colors.ink} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={54} cy={40} r={4} fill={colors.ink} />
      <Circle cx={70} cy={40} r={4} fill={colors.ink} />
      <Circle cx={40} cy={72} r={5} fill={colors.brown} />
      <Circle cx={50} cy={90} r={4} fill={colors.brown} />
    </Svg>
  );
}
