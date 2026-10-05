// Row or column of brush tool buttons (Free Draw rails, phone tray).
import { ScrollView, StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';
import type { BrushType } from '@/types/models';

import { ToolButton } from '../ToolButton';

export interface ToolRailProps {
  tools: BrushType[];
  selected: BrushType;
  onSelect: (t: BrushType) => void;
  horizontal?: boolean;
}

// Eraser always sits apart at the end of a vertical rail (mockup "Free Draw · iPad").
export function ToolRail({ tools, selected, onSelect, horizontal }: ToolRailProps) {
  const main = tools.filter((t) => t !== 'eraser');
  const hasEraser = tools.includes('eraser');
  if (horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tools.map((t) => (
          <ToolButton key={t} tool={t} selected={selected === t} onPress={() => onSelect(t)} />
        ))}
      </ScrollView>
    );
  }
  return (
    <View style={styles.col}>
      {main.map((t) => (
        <ToolButton key={t} tool={t} selected={selected === t} onPress={() => onSelect(t)} />
      ))}
      {hasEraser ? (
        <View style={styles.bottom}>
          <ToolButton tool="eraser" selected={selected === 'eraser'} onPress={() => onSelect('eraser')} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.sm },
  col: { flex: 1, alignItems: 'center', gap: space.sm },
  bottom: { marginTop: 'auto' },
});
