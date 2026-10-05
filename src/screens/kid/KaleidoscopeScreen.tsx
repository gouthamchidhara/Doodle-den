// Kaleidoscope (A5): square canvas, 2 (mirror) / 4 / 8 segments, black/white background (Big), all brushes but stamps.
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { exportPngBase64 } from '@/canvas/exportPng';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { SizePicker } from '@/components/kid/draw/SizePicker';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { IconButton } from '@/components/kid/IconButton';
import { BackgroundIcon } from '@/components/kid/icons/BackgroundIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SymmetryButton } from '@/components/kid/SymmetryButton';
import { setMeta } from '@/db/repositories/metaRepo';
import { playSound } from '@/services/audio';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { BrushType, StrokeDoc } from '@/types/models';

import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

type Segments = 2 | 4 | 8;

// Meta key remembering an artwork's segment count (needed to replay it).
export const kaleidoKey = (artworkId: string) => `kaleido_sym_${artworkId}`;

// Kaleidoscope screen.
export function KaleidoscopeScreen() {
  useKeepAwake();
  const { isTablet, ageMode } = useLayout();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [segments, setSegments] = useState<Segments>(8);
  const [box, setBox] = useState(0);
  const [done, setDone] = useState(false);
  useIntroVoice('intro_kaleidoscope');
  const s = useDrawingSession({
    activity: 'kaleidoscope',
    background: 'black',
    exporter: async (doc: StrokeDoc, longEdge: number) => exportPngBase64(doc, longEdge, { symmetry: segments }),
    extraFiles: async (id) => {
      await setMeta(kaleidoKey(id), String(segments));
      return [];
    },
  });
  const tools: BrushType[] = s.limits.tools.filter((t) => t !== 'stamp');
  const tool = tools.includes(s.tool) ? s.tool : 'crayon';

  const finish = async () => {
    const id = await s.finish();
    if (id) playSound('save-sparkle');
    setDone(true);
  };

  const segmentButtons = ([2, 4, 8] as const).map((n) => <SymmetryButton key={n} segments={n} selected={segments === n} onPress={() => setSegments(n)} />);
  const bgButton =
    ageMode === 'big' ? (
      <IconButton icon={<BackgroundIcon />} accessibilityLabel="Background color" onPress={() => s.setBackground(s.doc.background === 'black' ? 'white' : 'black')} />
    ) : null;

  const canvas = (
    <View style={styles.center} onLayout={(e) => setBox(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
      <View style={[styles.square, { width: box, height: box }]}>
        {box > 0 ? (
          <DrawingCanvas ref={canvasRef} doc={s.doc} onChange={s.setDoc} onStrokeStart={s.markStarted} tool={tool} color={s.color} size={s.size} symmetry={segments} clipToSquare disabled={done} />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <View style={styles.root}>
        <KidHeader
          left={<IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={() => canvasRef.current?.undo()} />}
          right={<PrimaryButton label={isTablet ? "I'm done!" : 'Done'} onPress={() => void finish()} />}
        />
        {isTablet ? (
          <View style={styles.middle}>
            <View style={[styles.panel, styles.rail]}>
              <ToolRail tools={tools} selected={tool} onSelect={s.setTool} />
            </View>
            {canvas}
            <View style={[styles.panel, styles.rail]}>
              {segmentButtons}
              <SizePicker sizes={s.limits.sizes} selected={s.size} onSelect={s.setSize} />
              {bgButton}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              {segmentButtons}
              {bgButton}
            </View>
            {canvas}
            <View style={[styles.panel, styles.tray]}>
              <ToolRail horizontal tools={tools} selected={tool} onSelect={s.setTool} />
            </View>
          </>
        )}
        <View style={[styles.panel, styles.tray]}>
          <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} />
        </View>
      </View>
      {done ? (
        <ChoiceBubble
          text="Beautiful!"
          voiceClip="mascot_beautiful"
          choices={[
            {
              label: 'New one',
              onPress: () => {
                s.newDrawing();
                canvasRef.current?.clear();
                setDone(false);
              },
            },
            { label: 'My Gallery', onPress: () => router.replace('/gallery') },
            { label: 'Home', onPress: () => router.replace('/home') },
          ]}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  root: { flex: 1, gap: space.lg },
  middle: { flex: 1, flexDirection: 'row', gap: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  square: { borderRadius: radius.panel, overflow: 'hidden', borderWidth: border.normal, borderColor: colors.borderSoft },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft },
  rail: { width: 104, alignItems: 'center', paddingVertical: space.md, gap: space.md },
  tray: { paddingVertical: space.md },
  row: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
});
