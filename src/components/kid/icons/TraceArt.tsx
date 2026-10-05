// Trace & Learn tile: dotted A being traced.
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import type { IconProps } from './IconProps';

// Trace & Learn tile illustration (A2: stroke 5, ink outlines).
export function TraceArt({ size = 120 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path d="M24 104L60 16l36 88M38 72h44" stroke={colors.leaf} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 16" />
      <Path d="M24 104L48 46" stroke={colors.ink} strokeWidth={8} strokeLinecap="round" />
      <Circle cx={48} cy={46} r={9} fill={colors.sun} stroke={colors.ink} strokeWidth={4} />
    </Svg>
  );
}
