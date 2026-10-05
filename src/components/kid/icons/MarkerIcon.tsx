// Marker tool.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Marker icon drawn with react-native-svg (A2 Icons).
export function MarkerIcon({ size = 42, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Rect x={14} y={6} width={14} height={24} rx={4} fill={colors.sky} stroke={color} strokeWidth={3} />
      <Path d="M16 30h10l-2 6h-6z" fill={color} />
    </Svg>
  );
}
