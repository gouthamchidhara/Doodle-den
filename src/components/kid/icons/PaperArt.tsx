// Paper Comes Alive tile: paper drawing + camera.
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Paper Comes Alive tile illustration (A2: stroke 5, ink outlines).
export function PaperArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Rect x={14} y={30} width={60} height={74} rx={6} fill={colors.white} stroke={colors.ink} strokeWidth={5} />
      <Path d="M26 78c8-14 16 6 24-8s10 6 14 2" stroke={colors.tomato} strokeWidth={5} strokeLinecap="round" />
      <Rect x={58} y={22} width={50} height={36} rx={8} fill={colors.sky} stroke={colors.ink} strokeWidth={5} />
      <Circle cx={83} cy={40} r={10} fill={colors.white} stroke={colors.ink} strokeWidth={4} />
    </Svg>
  );
}
