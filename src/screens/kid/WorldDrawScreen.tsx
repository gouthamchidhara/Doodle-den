// Draw a creature for a world (A5): ghost outline, "Send it!" after 3+ strokes, transparent trimmed export, name, enter the world.
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { exportTrimmedPng } from '@/canvas/exportTrimmed';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { SizePicker } from '@/components/kid/draw/SizePicker';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { IconButton } from '@/components/kid/IconButton';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { addCreature } from '@/games/worlds/addCreature';
import { NameCreature } from '@/games/worlds/NameCreature';
import { worldFor } from '@/games/worlds/worldConfig';
import { playSound } from '@/services/audio';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { BrushType } from '@/types/models';

import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

export const MIN_STROKES_TO_SEND = 3;

// World-draw screen.
export function WorldDrawScreen() {
  useKeepAwake();
  const { isTablet, ageMode } = useLayout();
  const params = useLocalSearchParams<{ world?: string }>();
  const cfg = worldFor(params.world);
  useIntroVoice('intro_world_draw');
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const s = useDrawingSession({ activity: 'world', exporter: async (doc, longEdge) => exportTrimmedPng(doc, longEdge) });
  const [phase, setPhase] = useState<'draw' | 'name'>('draw');
  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [box, setBox] = useState(0);
  const tools: BrushType[] = s.limits.tools.filter((t) => t !== 'stamp');
  const tool = tools.includes(s.tool) ? s.tool : 'crayon';
  const canSend = s.doc.strokes.length >= MIN_STROKES_TO_SEND;

  const send = async () => {
    if (!s.kidId || !canSend) return;
    const id = await s.finish();
    if (!id) return;
    playSound('save-sparkle');
    setArtworkId(id);
    setPhase('name');
  };

  const named = async (name: string) => {
    if (!s.kidId || !artworkId) return;
    const entityId = await addCreature(s.kidId, cfg.key, artworkId, name);
    router.replace({ pathname: cfg.route, params: { enter: entityId } });
  };

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <View style={styles.root}>
        <KidHeader
          left={<IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={() => canvasRef.current?.undo()} />}
          right={phase === 'draw' ? <PrimaryButton label="Send it!" disabled={!canSend} onPress={() => void send()} /> : null}
        />
        {phase === 'draw' ? (
          <>
            <View testID="world-canvas-area" style={styles.center} onLayout={(e) => setBox(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
              <View style={[styles.square, { width: box, height: box }]}>
                {box > 0 ? (
                  <DrawingCanvas
                    ref={canvasRef}
                    doc={s.doc}
                    onChange={s.setDoc}
                    onStrokeStart={s.markStarted}
                    tool={tool}
                    color={s.color}
                    size={s.size}
                    ghost={{ pathSvg: cfg.template, opacity: 0.3 }}
                  />
                ) : null}
              </View>
            </View>
            <View style={[styles.panel, styles.tray]}>
              <View style={styles.row}>
                <View style={styles.grow}>
                  <ToolRail horizontal tools={tools} selected={tool} onSelect={s.setTool} />
                </View>
                <SizePicker horizontal sizes={s.limits.sizes} selected={s.size} onSelect={s.setSize} />
              </View>
              <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} />
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <NameCreature big={ageMode === 'big'} onDone={(n) => void named(n)} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  root: { flex: 1, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  square: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft },
  tray: { paddingVertical: space.sm, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.sm },
  grow: { flex: 1 },
});
