// Magic shelf: wand and star.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Magic shelf illustration (A2: stroke 5, ink outlines).
export function ShelfMagicArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M20 100l52-52" stroke={colors.ink} strokeWidth={9} strokeLinecap="round" />
      <Path d="M82 14l7 17 17 7-17 7-7 17-7-17-17-7 17-7z" fill={colors.sun} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
    </Svg>
  );
}
