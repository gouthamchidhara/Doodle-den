// Speaker (replay voice prompt).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Speaker icon drawn with react-native-svg (A2 Icons).
export function SpeakerIcon({ size = 30, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M5 11h5l7-6v20l-7-6H5zM21 10a7 7 0 0 1 0 10M24 6a12 12 0 0 1 0 18" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
