// Moon and twinkling stars behind the lock screen.
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const STARS = [
  [0.08, 0.12, 3],
  [0.2, 0.3, 2],
  [0.3, 0.08, 2.5],
  [0.62, 0.14, 2],
  [0.74, 0.32, 3],
  [0.88, 0.1, 2],
  [0.94, 0.4, 2.5],
  [0.12, 0.55, 2],
  [0.05, 0.8, 3],
  [0.92, 0.7, 2],
  [0.45, 0.04, 2],
] as const;

// Full-screen decorative sky.
export function NightSky() {
  const { width, height } = useWindowDimensions();
  const r = Math.min(width, height) * 0.07;
  const mx = width * 0.84;
  const my = height * 0.16;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      {STARS.map(([x, y, s], i) => (
        <Circle key={i} cx={x * width} cy={y * height} r={s * 1.5} fill={colors.moon} opacity={0.8} />
      ))}
      <Path d={`M${mx} ${my - r}a${r} ${r} 0 1 0 ${r} ${r * 1.6}a${r * 0.85} ${r * 0.85} 0 1 1 ${-r} ${-r * 1.6}z`} fill={colors.moon} />
    </Svg>
  );
}
