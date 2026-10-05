// Story Maker tile: open book.
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Story Maker tile illustration (A2: stroke 5, ink outlines).
export function StoryMakerArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M60 32c-12-10-30-12-46-8v68c16-4 34-2 46 8 12-10 30-12 46-8V24c-16-4-34-2-46 8z" fill={colors.white} stroke={colors.ink} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M60 32v68" stroke={colors.ink} strokeWidth={5} />
      <Path d="M24 46h24M24 60h20M72 46h24M72 60h18" stroke={colors.sun} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}
