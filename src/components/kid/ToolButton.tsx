// Brush tool button for drawing screens (A2).
import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';

import { border, colors, radius } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { BrushType } from '@/types/models';

import { CrayonIcon } from './icons/CrayonIcon';
import { EraserIcon } from './icons/EraserIcon';
import { GlitterIcon } from './icons/GlitterIcon';
import type { IconProps } from './icons/IconProps';
import { MarkerIcon } from './icons/MarkerIcon';
import { NeonIcon } from './icons/NeonIcon';
import { StampIcon } from './icons/StampIcon';
import { WatercolorIcon } from './icons/WatercolorIcon';
import { PressableScale } from './PressableScale';

export const toolIcons: Record<BrushType, ComponentType<IconProps>> = {
  crayon: CrayonIcon,
  marker: MarkerIcon,
  watercolor: WatercolorIcon,
  glitter: GlitterIcon,
  neon: NeonIcon,
  stamp: StampIcon,
  eraser: EraserIcon,
};

export const toolLabels: Record<BrushType, string> = {
  crayon: 'Crayon',
  marker: 'Marker',
  watercolor: 'Watercolor',
  glitter: 'Glitter',
  neon: 'Neon',
  stamp: 'Stamps',
  eraser: 'Eraser',
};

export interface ToolButtonProps {
  tool: BrushType;
  selected: boolean;
  onPress?: () => void;
}

// Square tool button; selected = tomato tint fill with tomato border.
export function ToolButton({ tool, selected, onPress }: ToolButtonProps) {
  const { isTablet } = useLayout();
  const Icon = toolIcons[tool];
  const size = isTablet ? 70 : 54;
  return (
    <PressableScale
      accessibilityLabel={toolLabels[tool]}
      selected={selected}
      sound="tool-select"
      onPress={onPress}
      style={[styles.button, { width: size, height: size }, selected ? styles.selected : styles.unselected]}
    >
      <Icon size={isTablet ? 42 : 32} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  unselected: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  selected: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
});
