// My Gallery tile: framed landscape.
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// My Gallery tile illustration (A2: stroke 5, ink outlines).
export function GalleryArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={14} y={20} width={92} height={80} rx={10} fill={colors.white} stroke={colors.ink} strokeWidth={5} />
      <Path d="M22 90l26-30 18 18 12-12 20 24z" fill={colors.leaf} stroke={colors.ink} strokeWidth={4} strokeLinejoin="round" />
      <Circle cx={80} cy={42} r={9} fill={colors.sun} />
    </Svg>
  );
}
