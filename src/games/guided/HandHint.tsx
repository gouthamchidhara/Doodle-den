// A pointing hand that travels once along the step's path (A5 Guided Drawing).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const STEP_MS = 40;
const SIZE = 44;

// Hand overlay; restart by changing `key`.
export function HandHint({ points }: { points: [number, number][] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (points.length === 0) return undefined;
    const t = setInterval(() => setI((n) => (n + 1 >= points.length ? n : n + 1)), STEP_MS);
    return () => clearInterval(t);
  }, [points]);
  const p = points[i];
  if (!p || i >= points.length - 1) return null;
  return (
    <View pointerEvents="none" style={[styles.hand, { left: p[0] - 8, top: p[1] - 4 }]}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 44 44">
        <Path d="M10 4c2 0 4 2 4 4v14l2-2c2-2 5-1 6 1l1 2 2-1c2-1 4 0 5 2l1 1 2-1c2 0 4 1 4 4v8c0 5-4 9-9 9H20c-3 0-6-2-8-4L4 30c-1-2 0-4 2-5s4 0 5 1l-5-18c0-2 2-4 4-4z" fill={colors.white} stroke={colors.ink} strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hand: { position: 'absolute' },
});
