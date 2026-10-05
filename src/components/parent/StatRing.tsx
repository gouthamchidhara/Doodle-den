// Today's play ring: used vs limit (A2).
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export interface StatRingProps {
  used: number;
  limit: number;
}

const SIZE = 88;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

// Fraction of the ring filled, clamped to 0..1.
export function ringFraction(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(1, Math.max(0, used / limit));
}

// 88 px ring with a 12 px stroke; leaf progress on a gray track.
export function StatRing({ used, limit }: StatRingProps) {
  const filled = ringFraction(used, limit) * C;
  return (
    <Svg width={SIZE} height={SIZE} accessibilityLabel={`${Math.round(used)} of ${limit} minutes`}>
      <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.chartTrack} strokeWidth={STROKE} fill="none" />
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        stroke={colors.leaf}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${C}`}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
    </Svg>
  );
}
