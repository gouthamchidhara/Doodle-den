// Coloring screen chrome: header (Home, Undo, Done), tools (Big: brushes + bucket), palette; tablet and phone.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { IconButton } from '@/components/kid/IconButton';
import { BucketIcon } from '@/components/kid/icons/BucketIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { BrushType } from '@/types/models';

import type { useDrawingSession } from '../shared/useDrawingSession';

const BRUSHES: BrushType[] = ['crayon', 'marker', 'watercolor', 'glitter', 'neon', 'eraser'];

export interface ColoringControlsProps {
  session: ReturnType<typeof useDrawingSession>;
  little: boolean;
  bucket: boolean;
  onBucket: (on: boolean) => void;
  onUndo: () => void;
  onDone: () => void;
  canvas: ReactNode;
}

// Lays out the controls around the page.
export function ColoringControls({ session: s, little, bucket, onBucket, onUndo, onDone, canvas }: ColoringControlsProps) {
  const { isTablet } = useLayout();
  const tools = BRUSHES.filter((t) => s.limits.tools.includes(t));
  const bucketBtn = (
    <PressableScale accessibilityLabel="Fill bucket" selected={bucket} sound="tool-select" onPress={() => onBucket(true)} style={[styles.bucket, bucket ? styles.on : styles.off]}>
      <BucketIcon size={isTablet ? 42 : 32} />
    </PressableScale>
  );
  const pickTool = (t: BrushType) => {
    onBucket(false);
    s.setTool(t);
  };
  const toolsUi = little ? null : (
    <>
      {bucketBtn}
      <ToolRail horizontal={!isTablet} tools={tools} selected={bucket ? 'stamp' : s.tool} onSelect={pickTool} />
    </>
  );

  return (
    <View style={styles.root}>
      <KidHeader
        left={<IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={onUndo} />}
        right={<PrimaryButton label={isTablet ? "I'm done!" : 'Done'} onPress={onDone} />}
      />
      {isTablet ? (
        <View style={styles.middle}>
          {toolsUi ? <View style={[styles.panel, styles.rail]}>{toolsUi}</View> : null}
          <View style={styles.grow}>{canvas}</View>
        </View>
      ) : (
        <View style={styles.grow}>{canvas}</View>
      )}
      <View style={[styles.panel, styles.tray]}>
        {!isTablet && toolsUi ? <View style={styles.row}>{toolsUi}</View> : null}
        <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} showRainbow={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.lg },
  middle: { flex: 1, flexDirection: 'row', gap: space.lg },
  grow: { flex: 1 },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft },
  rail: { width: 104, alignItems: 'center', paddingVertical: space.md, gap: space.sm },
  tray: { paddingVertical: space.md, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.sm },
  bucket: { width: 64, height: 64, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
});
