// Zoo scene: sky, grass field with three ground lines, pond, trees, fence.
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { GROUND } from './animalMotion';

// Background sized to the scene.
export function ZooBackground({ width: w, height: h }: { width: number; height: number }) {
  const posts = Array.from({ length: 14 }, (_, i) => (i / 13) * w);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill={colors.tint.sky.fill} />
        <Circle cx={w * 0.86} cy={h * 0.14} r={h * 0.06} fill={colors.sun} />
        <Rect x={0} y={h * 0.42} width={w} height={h * 0.58} fill={colors.leaf} />
        <Ellipse cx={w * 0.78} cy={h * 0.5} rx={w * 0.12} ry={h * 0.05} fill={colors.sky} />
        {[0.12, 0.3, 0.6].map((x) => (
          <Path key={x} d={`M${w * x} ${h * 0.44}v-${h * 0.1}`} stroke={colors.brown} strokeWidth={w * 0.012} />
        ))}
        {[0.12, 0.3, 0.6].map((x) => (
          <Circle key={`c${x}`} cx={w * x} cy={h * 0.3} r={h * 0.07} fill={colors.tint.leaf.border} stroke={colors.ink} strokeWidth={3} />
        ))}
        <Path d={`M0 ${h * 0.47}H${w}`} stroke={colors.brown} strokeWidth={5} />
        <Path d={`M0 ${h * 0.43}H${w}`} stroke={colors.brown} strokeWidth={5} />
        {posts.map((x) => (
          <Rect key={x} x={x - 4} y={h * 0.4} width={8} height={h * 0.09} fill={colors.brown} />
        ))}
        {GROUND.map((g) => (
          <Path key={g} d={`M0 ${h * g}H${w}`} stroke={colors.tint.leaf.border} strokeWidth={3} strokeDasharray="10 14" opacity={0.6} />
        ))}
      </Svg>
    </View>
  );
}
