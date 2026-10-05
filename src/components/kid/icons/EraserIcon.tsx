// Eraser tool.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Eraser icon drawn with react-native-svg (A2 Icons).
export function EraserIcon({ size = 42, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path d="M8 26l14-14 12 12-10 10H14z" fill={colors.tint.pink.fill} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M16 18l12 12" stroke={color} strokeWidth={3} />
    </Svg>
  );
}
