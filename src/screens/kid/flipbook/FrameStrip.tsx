// Bottom strip: frame thumbnails (tap = edit, long-press = delete) and "+" to add a frame.
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/kid/PressableScale';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import type { StrokeDoc } from '@/types/models';

import { FrameThumb } from './FrameThumb';

export interface FrameStripProps {
  frames: StrokeDoc[];
  current: number;
  canAdd: boolean;
  onPick: (i: number) => void;
  onAskDelete: (i: number) => void;
  onAdd: () => void;
  thumb: number;
}

// Horizontal frame list.
export function FrameStrip({ frames, current, canAdd, onPick, onAskDelete, onAdd, thumb }: FrameStripProps) {
  const h = thumb / (frames[0]?.aspect || 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {frames.map((f, i) => (
        <PressableScale
          key={i}
          accessibilityLabel={`Frame ${i + 1}`}
          selected={i === current}
          onPress={() => onPick(i)}
          onLongPress={() => onAskDelete(i)}
          style={[styles.frame, i === current ? styles.on : styles.off]}
        >
          <FrameThumb doc={f} width={thumb} height={h} />
          <Text style={styles.num}>{i + 1}</Text>
        </PressableScale>
      ))}
      {canAdd ? (
        <PressableScale accessibilityLabel="Add frame" onPress={onAdd} style={[styles.frame, styles.add, { width: thumb + space.sm * 2, height: h + space.sm * 2 }]}>
          <Text style={styles.plus}>+</Text>
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingHorizontal: space.sm, alignItems: 'center' },
  frame: { padding: space.sm, borderRadius: radius.chip, alignItems: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  add: { backgroundColor: colors.surface, borderWidth: border.normal, borderColor: colors.borderNeutral, justifyContent: 'center' },
  num: { position: 'absolute', top: 2, left: 6, fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption, color: colors.inkMuted },
  plus: { fontFamily: fonts.display, fontSize: fontSize.kidHero, color: colors.inkMuted },
});
