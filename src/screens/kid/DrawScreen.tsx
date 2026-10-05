// Free Draw (A5): the full brush set on one canvas, autosaved, with "I'm done!" sheet and hold-to-clear.
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { MascotCorner } from '@/components/kid/MascotCorner';
import { SparkleBurst } from '@/components/kid/SparkleBurst';
import coachIdeas from '@/content/coachIdeas.json';
import { playSound } from '@/services/audio';
import { colors, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { StrokeDoc } from '@/types/models';

import { DrawPhoneLayout } from './draw/DrawPhoneLayout';
import { DrawTabletLayout } from './draw/DrawTabletLayout';
import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

export const BACKGROUNDS: StrokeDoc['background'][] = ['white', 'sun', 'sky', 'leaf', 'pink', 'black'];

type Phase = 'drawing' | 'confirmClear' | 'done';

// Free Draw screen; `artworkId` param continues a saved drawing.
export function DrawScreen() {
  useKeepAwake();
  const { isTablet } = useLayout();
  const params = useLocalSearchParams<{ artworkId?: string }>();
  const s = useDrawingSession({ activity: 'draw', artworkId: params.artworkId ?? null });
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const replayIntro = useIntroVoice('intro_draw');
  const [phase, setPhase] = useState<Phase>('drawing');
  const [sparkle, setSparkle] = useState(0);
  const [bubble, setBubble] = useState<{ text: string; voice?: string; id: number } | null>(null);
  const clearBubble = useCallback(() => setBubble(null), []);

  const done = async () => {
    const id = await s.finish();
    if (id) {
      playSound('save-sparkle');
      setSparkle((n) => n + 1);
    }
    setPhase('done');
  };

  const cycleBackground = () => {
    const i = BACKGROUNDS.indexOf(s.doc.background);
    s.setBackground(BACKGROUNDS[(i + 1) % BACKGROUNDS.length]);
  };

  const showIdea = () => {
    const idea = coachIdeas[Math.floor(Math.random() * coachIdeas.length)];
    setBubble({ text: idea.text, voice: idea.voice, id: Date.now() });
  };

  const canvas = (
    <View style={styles.fill} onLayout={(e) => s.onCanvasSize(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}>
      <DrawingCanvas
        ref={canvasRef}
        doc={s.doc}
        onChange={s.setDoc}
        onHistoryChange={s.setHistory}
        onStrokeStart={s.markStarted}
        tool={s.tool}
        color={s.color}
        size={s.size}
        stampId={s.stampId}
        disabled={phase !== 'drawing'}
      />
      <MascotCorner bubble={bubble} onPress={showIdea} onBubbleDone={clearBubble} />
    </View>
  );

  const layoutProps = {
    session: s,
    canvas,
    onDone: () => void done(),
    onUndo: () => canvasRef.current?.undo(),
    onRedo: () => canvasRef.current?.redo(),
    onAskClear: () => setPhase('confirmClear'),
    onCycleBackground: cycleBackground,
    onSpeaker: replayIntro,
  };

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      {isTablet ? <DrawTabletLayout {...layoutProps} /> : <DrawPhoneLayout {...layoutProps} />}
      {phase === 'confirmClear' ? (
        <ChoiceBubble
          text="Start fresh?"
          voiceClip="mascot_start_fresh"
          choices={[
            {
              label: 'Yes',
              tone: 'tomato',
              onPress: () => {
                void s.clear().then(() => canvasRef.current?.clear());
                setPhase('drawing');
              },
            },
            { label: 'No', onPress: () => setPhase('drawing') },
          ]}
        />
      ) : null}
      {phase === 'done' ? (
        <ChoiceBubble
          text="Beautiful!"
          voiceClip="mascot_beautiful"
          choices={[
            {
              label: 'New drawing',
              onPress: () => {
                s.newDrawing();
                canvasRef.current?.clear();
                setPhase('drawing');
              },
            },
            { label: 'My Gallery', onPress: () => router.replace('/gallery') },
            { label: 'Home', onPress: () => router.replace('/home') },
          ]}
        />
      ) : null}
      {sparkle > 0 ? <SparkleBurst key={sparkle} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  fill: { flex: 1 },
});
