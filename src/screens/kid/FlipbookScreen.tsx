// Flipbook Studio (A5, Big mode): 3–8 frames with onion skin, 3 speeds, looping preview, saved as one gallery item.
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { renderDocImage } from '@/canvas/exportPng';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { IconButton } from '@/components/kid/IconButton';
import { PlayIcon } from '@/components/kid/icons/PlayIcon';
import { SpeedIcon } from '@/components/kid/icons/SpeedIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { trashArtwork } from '@/db/repositories/artworkRepo';
import { addFrame, canDelete, deleteFrame, hasDrawing, MAX_FRAMES, newDraft, SPEEDS, updateFrame, type FlipbookDraft, type Fps } from '@/games/flipbook/flipbookModel';
import { saveFlipbookDraft } from '@/games/flipbook/saveFlipbook';
import { playSound } from '@/services/audio';
import { useCanvasStore } from '@/state/canvasStore';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { FlipbookPlayer } from './flipbook/FlipbookPlayer';
import { FrameStrip } from './flipbook/FrameStrip';
import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

const SPEED_LABEL = { 2: 'Slow', 4: 'Medium', 8: 'Fast' } as const;

// Flipbook Studio screen.
export function FlipbookScreen() {
  useKeepAwake();
  const { isTablet, width } = useLayout();
  useIntroVoice('intro_flipbook');
  const s = useDrawingSession({ activity: 'flipbook_frame' });
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [draft, setDraft] = useState<FlipbookDraft>(() => newDraft(1));
  const [current, setCurrent] = useState(0);
  const [fps, setFps] = useState<Fps>(4);
  const [playing, setPlaying] = useState(false);
  const [askDelete, setAskDelete] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const saved = useRef<{ id: string; createdAt: number } | null>(null);
  const latest = useRef({ draft, fps, kidId: s.kidId });
  useLayoutEffect(() => {
    latest.current = { draft, fps, kidId: s.kidId };
  });

  const save = async (): Promise<boolean> => {
    const { draft: d, fps: f, kidId } = latest.current;
    if (!kidId || !hasDrawing(d)) return false;
    const r = await saveFlipbookDraft(kidId, d, f, saved.current?.id ?? null, saved.current?.createdAt ?? null);
    saved.current = { id: r.id, createdAt: saved.current?.createdAt ?? Date.now() };
    setDraft((cur) => ({ ...cur, frameIds: cur.frameIds.map((x, i) => r.frameIds[i] ?? x) }));
    return true;
  };
  const saveRef = useRef(save);
  useLayoutEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    const unregister = useCanvasStore.getState().register(async () => {
      await saveRef.current();
    });
    return () => {
      unregister();
      saveRef.current().catch((e: unknown) => console.warn('[flipbook] save failed', e));
    };
  }, []);

  const onion = useMemo(() => {
    const prev = draft.frames[current - 1];
    if (!prev || prev.strokes.length === 0 || box.w === 0) return null;
    return renderDocImage(prev, Math.max(box.w, box.h), { transparent: true });
  }, [draft.frames, current, box]);

  const onLayout = (w: number, h: number) => {
    setBox({ w, h });
    setDraft((d) => (hasDrawing(d) ? d : { ...d, frames: d.frames.map((f) => ({ ...f, aspect: w / h })) }));
  };

  const pick = (i: number) => setCurrent(i);

  const confirmDelete = (i: number) => {
    const out = deleteFrame(draft, i);
    if (out.removedId) trashArtwork(out.removedId).catch((e: unknown) => console.warn('[flipbook] trash failed', e));
    setDraft(out.draft);
    setCurrent((c) => Math.min(c, out.draft.frames.length - 1));
    setAskDelete(null);
  };

  const finish = async () => {
    if (await save()) playSound('save-sparkle');
    setDone(true);
  };

  const thumb = isTablet ? 96 : 64;
  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <View style={styles.root}>
        <KidHeader
          left={
            <>
              <IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={() => canvasRef.current?.undo()} />
              <IconButton size={isTablet ? 64 : 52} icon={<PlayIcon />} accessibilityLabel="Play" onPress={() => setPlaying(true)} />
            </>
          }
          right={<PrimaryButton label={isTablet ? "I'm done!" : 'Done'} onPress={() => void finish()} />}
        />
        <View style={styles.speeds}>
          {SPEEDS.map((f) => (
            <PressableScale key={f} accessibilityLabel={SPEED_LABEL[f]} selected={fps === f} onPress={() => setFps(f)} style={[styles.speed, fps === f ? styles.on : styles.off]}>
              <SpeedIcon speed={f} />
            </PressableScale>
          ))}
        </View>
        <View style={[styles.panel, styles.canvas]} onLayout={(e) => onLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}>
          <DrawingCanvas
            key={current}
            ref={canvasRef}
            doc={draft.frames[current]}
            onChange={(d) => setDraft((cur) => updateFrame(cur, current, d))}
            tool={s.tool}
            color={s.color}
            size={s.size}
            ghost={onion ? { image: onion, opacity: 0.25 } : undefined}
            disabled={done || playing}
          />
        </View>
        <View style={[styles.panel, styles.tray]}>
          <FrameStrip
            frames={draft.frames}
            current={current}
            canAdd={draft.frames.length < MAX_FRAMES}
            onPick={pick}
            onAskDelete={(i) => (canDelete(draft) ? setAskDelete(i) : undefined)}
            onAdd={() => {
              setDraft((d) => addFrame(d));
              setCurrent(draft.frames.length);
            }}
            thumb={thumb}
          />
          <ToolRail horizontal tools={s.limits.tools.filter((t) => t !== 'stamp')} selected={s.tool} onSelect={s.setTool} />
          <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} />
        </View>
      </View>
      {playing ? <FlipbookPlayer frames={draft.frames} fps={fps} width={Math.min(width * 0.8, 700)} onClose={() => setPlaying(false)} /> : null}
      {askDelete !== null ? (
        <ChoiceBubble
          text="Delete this page?"
          choices={[
            { label: 'Yes', tone: 'tomato', onPress: () => confirmDelete(askDelete) },
            { label: 'No', onPress: () => setAskDelete(null) },
          ]}
        />
      ) : null}
      {done ? (
        <ChoiceBubble
          text="Beautiful!"
          voiceClip="mascot_beautiful"
          choices={[
            { label: 'Watch it', onPress: () => (setDone(false), setPlaying(true)) },
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
  root: { flex: 1, gap: space.md },
  speeds: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
  speed: { width: 64, height: 56, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  canvas: { flex: 1 },
  tray: { paddingVertical: space.sm, gap: space.sm },
});
