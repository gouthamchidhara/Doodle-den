// Soft checkerboard behind transparent results (shows what was keyed out).
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

// Fills its parent.
export function Checkerboard({ cell = 16 }: { cell?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="cb" width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
          <Rect width={cell * 2} height={cell * 2} fill={colors.white} />
          <Rect width={cell} height={cell} fill={colors.surfaceMuted} />
          <Rect x={cell} y={cell} width={cell} height={cell} fill={colors.surfaceMuted} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#cb)" />
    </Svg>
  );
}
