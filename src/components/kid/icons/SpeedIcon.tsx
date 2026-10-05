// Flipbook speed icons: turtle (2 fps), rabbit (4 fps), cheetah (8 fps).
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// One animal per speed.
export function SpeedIcon({ speed, size = 36 }: IconProps & { speed: 2 | 4 | 8 }) {
  const s = { stroke: colors.ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {speed === 2 ? (
        <>
          <Path d="M8 26c0-9 6-14 13-14s13 5 13 14z" fill={colors.leaf} {...s} />
          <Circle cx={36} cy={24} r={3.5} fill={colors.tint.leaf.fill} {...s} />
          <Path d="M12 26v4M28 26v4" {...s} />
        </>
      ) : speed === 4 ? (
        <>
          <Ellipse cx={20} cy={27} rx={11} ry={8} fill={colors.white} {...s} />
          <Path d="M15 20c-3-6-3-13 0-14 3 1 3 8 2 14M23 20c1-6 3-13 6-13 2 2 0 9-4 14" fill={colors.white} {...s} />
          <Circle cx={17} cy={26} r={1.5} fill={colors.ink} />
        </>
      ) : (
        <>
          <Path d="M4 24c4-6 12-8 22-7l8-4 2 6-4 2c-2 5-8 8-16 8H6z" fill={colors.sun} {...s} />
          <Circle cx={14} cy={23} r={1.5} fill={colors.ink} />
          <Circle cx={19} cy={21} r={1.5} fill={colors.ink} />
          <Circle cx={24} cy={24} r={1.5} fill={colors.ink} />
          <Path d="M10 30l-3 5M26 29l3 5" {...s} />
        </>
      )}
    </Svg>
  );
}
