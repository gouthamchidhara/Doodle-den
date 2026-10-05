// Coloring page (A5): Little = tap-fill; Big = brushes under the line art + bucket. Saves fills to continue later.
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useMemo, useRef, useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { resolveColor } from '@/canvas/color';
import { exportPngBase64 } from '@/canvas/exportPng';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { SparkleBurst } from '@/components/kid/SparkleBurst';
import { setMeta } from '@/db/repositories/metaRepo';
import { useColoringPage } from '@/games/coloring/useColoringPage';
import { useSessionStore } from '@/state/sessionStore';
import { playSound } from '@/services/audio';
import { colors, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { StrokeDoc } from '@/types/models';

import { ColoringControls } from './coloring/ColoringControls';
import { useDrawingSession } from './shared/useDrawingSession';

// Meta key linking a saved coloring artwork to its page (for "continue").
export const coloringPageKey = (artworkId: string) => `coloring_page_${artworkId}`;

// The coloring screen for one page.
export function ColoringScreen() {
  useKeepAwake();
  const { isTablet, ageMode } = useLayout();
  const params = useLocalSearchParams<{ pageId: string; artworkId?: string }>();
  const pageId = params.pageId ?? 'cat';
  const artworkId = params.artworkId ?? null;
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const actions = useRef<('fill' | 'stroke')[]>([]);
  const [bucket, setBucket] = useState(true);
  const [done, setDone] = useState(false);
  const [sparkle, setSparkle] = useState(0);
  const [box, setBox] = useState(0);

  const s0 = useSessionStore((st) => st.activeKidId);
  const resume = useMemo(() => ({ kidId: s0, artworkId }), [s0, artworkId]);
  const page = useColoringPage(pageId, resume);
  const little = ageMode === 'little';
  const fillMode = little || bucket;

  const s = useDrawingSession({
    activity: 'coloring',
    artworkId,
    version: page.version,
    hasContent: page.hasFills,
    exporter: async (doc: StrokeDoc, longEdge: number) => exportPngBase64(doc, longEdge, { underlay: page.fillImage, overlay: page.lineArt }),
    extraFiles: async (id) => {
      await setMeta(coloringPageKey(id), pageId);
      return s0 ? page.writeFill(s0, id) : [];
    },
  });

  const tap = (e: GestureResponderEvent) => {
    if (box <= 0) return;
    const { locationX, locationY } = e.nativeEvent;
    if (page.fillAt(locationX / box, locationY / box, resolveColor(s.color === 'rainbow' ? 'tomato' : s.color))) {
      actions.current.push('fill');
      playSound('splash');
      setSparkle((n) => n + 1);
    }
  };

  const undo = () => {
    const last = actions.current.pop();
    if (last === 'fill') page.undoFill();
    else if (last === 'stroke') canvasRef.current?.undo();
  };

  const finish = async () => {
    const id = await s.finish();
    if (id) playSound('save-sparkle');
    setDone(true);
  };

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <ColoringControls
        session={s}
        little={little}
        bucket={bucket}
        onBucket={setBucket}
        onUndo={undo}
        onDone={() => void finish()}
        canvas={
          <View testID="coloring-area" style={styles.center} onLayout={(e) => setBox(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
            <View style={[styles.page, { width: box, height: box }]}>
              {page.ready ? (
                <DrawingCanvas
                  ref={canvasRef}
                  doc={s.doc}
                  onChange={s.setDoc}
                  onStrokeStart={() => {
                    actions.current.push('stroke');
                    s.markStarted();
                  }}
                  tool={s.tool}
                  color={s.color}
                  size={s.size}
                  underlay={page.fillImage}
                  overlay={page.lineArt}
                  disabled={fillMode || done}
                />
              ) : null}
              {fillMode && !done ? <Pressable accessibilityLabel="Coloring page" style={StyleSheet.absoluteFill} onPress={tap} /> : null}
              {sparkle > 0 ? <SparkleBurst key={sparkle} radius={60} /> : null}
            </View>
          </View>
        }
      />
      {done ? (
        <ChoiceBubble
          text="Beautiful!"
          voiceClip="mascot_beautiful"
          choices={[
            { label: 'More pages', onPress: () => router.replace('/coloring') },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { backgroundColor: colors.white, overflow: 'hidden' },
});
