// Learn shelf: letter A block.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Learn shelf illustration (A2: stroke 5, ink outlines).
export function ShelfLearnArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={18} y={18} width={84} height={84} rx={14} fill={colors.leaf} stroke={colors.ink} strokeWidth={6} />
      <Path d="M40 88l20-54 20 54M48 70h24" stroke={colors.white} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
