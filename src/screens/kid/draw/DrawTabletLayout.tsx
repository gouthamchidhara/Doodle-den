// Free Draw tablet layout (mockup "Free Draw · iPad"): top bar, left tool rail, canvas, right size rail, bottom palette.
import { StyleSheet, Text, View } from 'react-native';

import { BackgroundIcon } from '@/components/kid/icons/BackgroundIcon';
import { CheckIcon } from '@/components/kid/icons/CheckIcon';
import { RedoIcon } from '@/components/kid/icons/RedoIcon';
import { SpeakerIcon } from '@/components/kid/icons/SpeakerIcon';
import { TrashIcon } from '@/components/kid/icons/TrashIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { IconButton } from '@/components/kid/IconButton';
import { KidHeader } from '@/components/kid/KidHeader';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { SizePicker } from '@/components/kid/draw/SizePicker';
import { StampTray } from '@/components/kid/draw/StampTray';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import type { DrawLayoutProps } from './drawLayoutProps';

export const CLEAR_HOLD_MS = 1500;

// Tablet arrangement of the Free Draw controls around the canvas.
export function DrawTabletLayout({ session: s, canvas, onDone, onUndo, onRedo, onAskClear, onCycleBackground, onSpeaker }: DrawLayoutProps) {
  return (
    <View style={styles.root}>
      <KidHeader
        left={
          <>
            <IconButton icon={<UndoIcon />} accessibilityLabel="Undo" onPress={onUndo} />
            <IconButton icon={<RedoIcon />} accessibilityLabel="Redo" onPress={onRedo} />
            <IconButton icon={<TrashIcon />} accessibilityLabel="Hold to start fresh" onLongPress={onAskClear} delayLongPress={CLEAR_HOLD_MS} />
          </>
        }
        right={
          <>
            <IconButton icon={<SpeakerIcon />} accessibilityLabel="Say it again" onPress={onSpeaker} />
            <PrimaryButton label="I'm done!" icon={<CheckIcon color={colors.white} />} onPress={onDone} />
          </>
        }
      />
      <View style={styles.middle}>
        <View style={[styles.panel, styles.rail]}>
          <ToolRail tools={s.limits.tools} selected={s.tool} onSelect={s.setTool} />
        </View>
        <View style={[styles.panel, styles.canvas]}>{canvas}</View>
        <View style={[styles.panel, styles.rail]}>
          <Text style={styles.label}>SIZE</Text>
          <SizePicker sizes={s.limits.sizes} selected={s.size} onSelect={s.setSize} />
          <View style={styles.bottom}>
            <IconButton icon={<BackgroundIcon />} accessibilityLabel="Background color" onPress={onCycleBackground} />
          </View>
        </View>
      </View>
      <View style={[styles.panel, styles.palette]}>
        {s.tool === 'stamp' ? (
          <StampTray selected={s.stampId} onSelect={s.setStamp} />
        ) : (
          <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.lg },
  middle: { flex: 1, flexDirection: 'row', gap: space.lg, minHeight: 0 },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  rail: { width: 104, alignItems: 'center', paddingVertical: space.md, gap: space.lg },
  canvas: { flex: 1 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption, color: colors.inkMuted },
  bottom: { marginTop: 'auto' },
  palette: { paddingVertical: space.md, minHeight: 84, justifyContent: 'center' },
});
