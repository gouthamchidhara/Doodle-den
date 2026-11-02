// Music Paint (A5): every color sings a note while you draw; Play replays the drawing with its song.
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { REPLAY_CAP_MS } from '@/canvas/replay';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { IconButton } from '@/components/kid/IconButton';
import { PlayIcon } from '@/components/kid/icons/PlayIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { saveMusic } from '@/db/repositories/musicRepo';
import { liveEvents, newNoteClock, notePoint, scheduleNotes, type NoteClock, type NoteEvent } from '@/games/music/noteEvents';
import { noteForColor, playNote } from '@/games/music/notes';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { writeText } from '@/services/files';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { StrokeDoc, StrokePoint } from '@/types/models';

import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

// Notes file next to the artwork (A5).
export const notesPath = (kidId: string, artworkId: string) => `art/${kidId}/${artworkId}.notes.json`;

// Music Paint screen.
export function MusicScreen() {
  useKeepAwake();
  const { isTablet } = useLayout();
  useIntroVoice('intro_music');
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const events = useRef<NoteEvent[]>([]);
  const pending = useRef<Omit<NoteEvent, 'strokeId' | 't'>[]>([]);
  const clock = useRef<NoteClock | null>(null);
  const cancel = useRef<(() => void) | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [firstSave, setFirstSave] = useState(true);
  const docRef = useRef<StrokeDoc | null>(null);

  const s = useDrawingSession({
    activity: 'music',
    extraFiles: async (id) => {
      const kid = s.kidId;
      const doc = docRef.current;
      if (!kid || !doc) return [];
      const rel = notesPath(kid, id);
      writeText(rel, JSON.stringify(liveEvents(doc, events.current)));
      await saveMusic({ artworkId: id, notesPath: rel });
      if (firstSave) {
        setFirstSave(false);
        await checkRewards(kid, 'MUSIC_SAVED');
      }
      return [rel];
    },
  });
  useEffect(() => {
    docRef.current = s.doc;
  });
  useEffect(() => () => cancel.current?.(), []);

  const onPoint = (p: StrokePoint) => {
    const first = clock.current === null;
    if (first) clock.current = newNoteClock(p, box.w, box.h);
    const out = notePoint(clock.current ?? newNoteClock(p, box.w, box.h), p, box.w, box.h, first);
    clock.current = out.clock;
    if (out.volume === null) return;
    const note = noteForColor(s.color);
    playNote(note, out.volume);
    pending.current.push({ note, x: p.x, y: p.y, dt: p.t });
  };

  const onChange = (d: StrokeDoc) => {
    const prev = s.doc.strokes.length;
    if (d.strokes.length > prev && pending.current.length > 0) {
      const id = d.strokes[d.strokes.length - 1].id;
      events.current.push(...pending.current.map((e) => ({ ...e, strokeId: id, t: 0 })));
    }
    pending.current = [];
    clock.current = null;
    s.setDoc(d);
  };

  const play = () => {
    cancel.current?.();
    canvasRef.current?.replay(REPLAY_CAP_MS);
    cancel.current = scheduleNotes(s.doc, events.current, playNote);
  };

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <View style={styles.root}>
        <KidHeader
          left={
            <>
              <IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={() => canvasRef.current?.undo()} />
              <IconButton size={isTablet ? 64 : 52} icon={<PlayIcon />} accessibilityLabel="Play my song" onPress={play} />
            </>
          }
        />
        <View testID="music-area" style={[styles.panel, styles.grow]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          {box.w > 0 ? (
            <DrawingCanvas ref={canvasRef} doc={s.doc} onChange={onChange} onStrokeStart={s.markStarted} onStrokePoint={onPoint} tool="marker" color={s.color} size="L" />
          ) : null}
        </View>
        <View style={[styles.panel, styles.tray]}>
          <PaletteBar selected={s.color} onSelect={s.setColor} showRainbow={false} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  root: { flex: 1, gap: space.md },
  grow: { flex: 1 },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  tray: { paddingVertical: space.md },
});
