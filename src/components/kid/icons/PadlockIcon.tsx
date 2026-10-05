// Padlock (grown-ups, locked tiles).
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Padlock icon drawn with react-native-svg (A2 Icons).
export function PadlockIcon({ size = 22, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x={4} y={10} width={14} height={10} rx={3} stroke={color} strokeWidth={2.2} />
      <Path d="M7 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.2} />
    </Svg>
  );
}
