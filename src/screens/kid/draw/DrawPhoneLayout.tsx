// Free Draw phone layout (mockup "Wind-down warning · phone"): top bar, canvas, bottom tray (tools row + colors row).
import { StyleSheet, View } from 'react-native';

import { BrushSizeButton } from '@/components/kid/BrushSizeButton';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { StampTray } from '@/components/kid/draw/StampTray';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { IconButton } from '@/components/kid/IconButton';
import { TrashIcon } from '@/components/kid/icons/TrashIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { border, colors, radius, space } from '@/theme/tokens';

import type { DrawLayoutProps } from './drawLayoutProps';
import { CLEAR_HOLD_MS } from './DrawTabletLayout';

// Next size in the allowed list (phone has one size button that cycles).
export function nextSize<T>(sizes: T[], current: T): T {
  const i = sizes.indexOf(current);
  return sizes[(i + 1) % sizes.length];
}

// Phone arrangement: everything below the canvas in one tray.
export function DrawPhoneLayout({ session: s, canvas, onDone, onUndo, onAskClear }: DrawLayoutProps) {
  return (
    <View style={styles.root}>
      <KidHeader
        left={<IconButton size={52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={onUndo} />}
        right={<PrimaryButton label="Done" onPress={onDone} />}
      />
      <View style={[styles.panel, styles.canvas]}>{canvas}</View>
      <View style={[styles.panel, styles.tray]}>
        <View style={styles.row}>
          <View style={styles.grow}>
            <ToolRail horizontal tools={s.limits.tools} selected={s.tool} onSelect={s.setTool} />
          </View>
          <BrushSizeButton size={s.size} selected onPress={() => s.setSize(nextSize(s.limits.sizes, s.size))} />
          <IconButton size={52} icon={<TrashIcon />} accessibilityLabel="Hold to start fresh" onLongPress={onAskClear} delayLongPress={CLEAR_HOLD_MS} />
        </View>
        {s.tool === 'stamp' ? (
          <StampTray selected={s.stampId} onSelect={s.setStamp} bonus={s.bonusStamps} />
        ) : (
          <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.md },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  canvas: { flex: 1 },
  tray: { paddingVertical: space.sm, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.sm },
  grow: { flex: 1 },
});
