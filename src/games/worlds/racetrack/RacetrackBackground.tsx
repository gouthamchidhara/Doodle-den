// Top-down racetrack: grass, gray oval with white dashes, checkered start line, stands.
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { trackGeom } from './track';

// Stadium path at a given radius offset.
function stadium(cx: number, cy: number, half: number, r: number): string {
  return `M${cx - half} ${cy + r}H${cx + half}A${r} ${r} 0 0 0 ${cx + half} ${cy - r}H${cx - half}A${r} ${r} 0 0 0 ${cx - half} ${cy + r}Z`;
}

// Background sized to the scene.
export function RacetrackBackground({ width, height }: { width: number; height: number }) {
  const g = trackGeom(width, height);
  const trackW = g.laneW * 6;
  const sq = trackW / 6;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={colors.tint.leaf.fill} />
        <Rect x={width * 0.1} y={height * 0.06} width={width * 0.8} height={height * 0.07} rx={12} fill={colors.tint.sky.border} />
        <Path d={stadium(g.cx, g.cy, g.half, g.r)} stroke={colors.borderNeutral} strokeWidth={trackW} fill="none" />
        <Path d={stadium(g.cx, g.cy, g.half, g.r)} stroke={colors.white} strokeWidth={4} strokeDasharray="22 18" fill="none" />
        {Array.from({ length: 12 }, (_, i) => (
          <Rect key={i} x={g.cx + (i % 2) * sq} y={g.cy + g.r - trackW / 2 + Math.floor(i / 2) * sq} width={sq} height={sq} fill={i % 2 === Math.floor(i / 2) % 2 ? colors.ink : colors.white} />
        ))}
      </Svg>
    </View>
  );
}
