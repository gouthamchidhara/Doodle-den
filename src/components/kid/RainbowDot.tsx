// Round rainbow swatch (the only multi-color fill allowed, A2).
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const SLICES = [colors.tomato, colors.orange, colors.sun, colors.leaf, colors.sky, colors.grape];

// Pie slice i of n in a 100 box.
function slice(i: number, n: number): string {
  const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
  const p = (a: number) => `${50 + 50 * Math.cos(a)} ${50 + 50 * Math.sin(a)}`;
  return `M50 50 L${p(a0)} A50 50 0 0 1 ${p(a1)} Z`;
}

// Rainbow pie circle.
export function RainbowDot({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {SLICES.map((c, i) => (
        <Path key={c} d={slice(i, SLICES.length)} fill={c} />
      ))}
    </Svg>
  );
}
