// Kaleidoscope segment button: shows a circle split into 2 (mirror), 4 or 8 parts.
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { border, colors, radius } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

export interface SymmetryButtonProps {
  segments: 2 | 4 | 8;
  selected: boolean;
  onPress: () => void;
}

const LABEL = { 2: 'Mirror', 4: 'Four parts', 8: 'Eight parts' } as const;

// Big icon button for one segment count.
export function SymmetryButton({ segments, selected, onPress }: SymmetryButtonProps) {
  const lines = Array.from({ length: segments / 2 }, (_, i) => (i * Math.PI) / (segments / 2) + Math.PI / 2);
  return (
    <PressableScale accessibilityLabel={LABEL[segments]} selected={selected} sound="tool-select" onPress={onPress} style={[styles.button, selected ? styles.on : styles.off]}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        <Circle cx={20} cy={20} r={16} fill={colors.tint.grape.fill} stroke={colors.ink} strokeWidth={2.5} />
        {lines.map((a) => (
          <Line key={a} x1={20 + Math.cos(a) * 16} y1={20 + Math.sin(a) * 16} x2={20 - Math.cos(a) * 16} y2={20 - Math.sin(a) * 16} stroke={colors.ink} strokeWidth={2.5} />
        ))}
      </Svg>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { width: 64, height: 64, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
});
