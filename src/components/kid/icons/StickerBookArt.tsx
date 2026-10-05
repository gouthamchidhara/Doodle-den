// Sticker Book tile: peeling star sticker.
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Sticker Book tile illustration (A2: stroke 5, ink outlines).
export function StickerBookArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={18} y={18} width={84} height={84} rx={20} fill={colors.orange} stroke={colors.ink} strokeWidth={5} />
      <Path d="M60 34l8 16 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3z" fill={colors.white} />
      <Path d="M102 74c-16 0-28 12-28 28" fill={colors.tint.orange.fill} stroke={colors.ink} strokeWidth={5} />
    </Svg>
  );
}
