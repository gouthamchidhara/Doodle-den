// Microphone.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Mic icon drawn with react-native-svg (A2 Icons).
export function MicIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Rect x={10} y={3} width={10} height={16} rx={5} stroke={color} strokeWidth={3} />
      <Path d="M6 14a9 9 0 0 0 18 0M15 23v4" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
