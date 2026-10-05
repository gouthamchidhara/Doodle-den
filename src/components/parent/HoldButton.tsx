// Press-and-hold button with a filling ring; fires after holdMs, resets if released early.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts, fontSize, space } from '@/theme/tokens';

export interface HoldButtonProps {
  label: string;
  holdMs?: number;
  onComplete: () => void;
  size?: number;
}

const STROKE = 8;

// Ring fills while held; completes once.
export function HoldButton({ label, holdMs = 2000, onComplete, size = 140 }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const onPressIn = () => {
    stop();
    start.current = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        stop();
        onComplete();
      }
    }, 30);
  };
  const onPressOut = () => {
    stop();
    setProgress((p) => (p >= 1 ? p : 0));
  };

  const r = (size - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Press and hold" onPressIn={onPressIn} onPressOut={onPressOut}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.chartTrack} strokeWidth={STROKE} fill={colors.surface} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.ink}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${progress * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.md },
  label: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.inkMuted },
});
