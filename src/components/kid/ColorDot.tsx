// Round paint color button; rainbow is the only gradient-like fill allowed (A2).
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { border, colors, radius } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { PaletteKey } from '@/types/models';

import { PressableScale } from './PressableScale';

export interface ColorDotProps {
  color: PaletteKey | 'rainbow' | { hex: string; name: string };
  selected: boolean;
  onPress?: () => void;
}

const RAINBOW = [colors.tomato, colors.orange, colors.sun, colors.leaf, colors.sky, colors.grape];

// Pie-slice path for slice i of n inside a 100x100 box.
function slicePath(i: number, n: number): string {
  const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
  const p = (a: number) => `${50 + 50 * Math.cos(a)} ${50 + 50 * Math.sin(a)}`;
  return `M50 50 L${p(a0)} A50 50 0 0 1 ${p(a1)} Z`;
}

// Human-readable name for the accessibility label.
function colorName(color: ColorDotProps['color']): string {
  if (typeof color === 'object') return color.name;
  return color === 'rainbow' ? 'Rainbow' : color;
}

// Circle of paint; selected gets a thick ink ring.
export function ColorDot({ color, selected, onPress }: ColorDotProps) {
  const { isTablet } = useLayout();
  const size = isTablet ? 56 : 44;
  const fill = typeof color === 'object' ? color.hex : color === 'rainbow' ? colors.white : colors[color];
  const ring = selected ? colors.ink : color === 'white' ? colors.borderNeutral : colors.white;
  return (
    <PressableScale
      accessibilityLabel={colorName(color)}
      selected={selected}
      sound="color-pick"
      onPress={onPress}
      style={[
        styles.dot,
        { width: size, height: size, backgroundColor: fill, borderColor: ring, borderWidth: selected ? border.selected : border.thick },
      ]}
    >
      {color === 'rainbow' ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            {RAINBOW.map((c, i) => (
              <Path key={c} d={slicePath(i, RAINBOW.length)} fill={c} />
            ))}
          </Svg>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  dot: { borderRadius: radius.round, overflow: 'hidden' },
});
