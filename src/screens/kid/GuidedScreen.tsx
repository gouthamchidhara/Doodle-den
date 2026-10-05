// Guided Drawing (A5, Big mode): pick a lesson; each step shows a ghost path, a moving hand and a voice line.
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { ToolRail } from '@/components/kid/draw/ToolRail';
import { IconButton } from '@/components/kid/IconButton';
import { ArrowRightIcon } from '@/components/kid/icons/ArrowRightIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { LessonCard } from '@/components/kid/LessonCard';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { GUIDED_LESSONS, guidedSkill, type GuidedLesson } from '@/content/guidedLessons';
import { getProgress, setSkill } from '@/db/repositories/progressRepo';
import { HandHint } from '@/games/guided/HandHint';
import { handPoints } from '@/games/guided/handPoints';
import { playSound } from '@/services/audio';
import { say } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { BrushType } from '@/types/models';

import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

const TOOLS: BrushType[] = ['crayon', 'marker', 'watercolor', 'glitter', 'eraser'];

// Guided Drawing screen.
export function GuidedScreen() {
  useKeepAwake();
  const { isTablet, width } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  useIntroVoice('intro_guided');
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [lesson, setLesson] = useState<GuidedLesson | null>(null);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState(0);
  const [done, setDone] = useState(false);
  const [finished, setFinished] = useState<Set<string>>(new Set());
  const s = useDrawingSession({ activity: 'guided' });
  const current = lesson?.steps[step];
  const last = !!lesson && step === lesson.steps.length - 1;
  const points = useMemo(() => (current?.pathSvg && box > 0 ? handPoints(current.pathSvg, box, box) : []), [current, box]);

  useEffect(() => {
    if (!kidId) return;
    getProgress(kidId)
      .then((rows) => setFinished(new Set(rows.filter((r) => r.skill.startsWith('guided_')).map((r) => r.skill))))
      .catch((e: unknown) => console.warn('[guided] progress failed', e));
  }, [kidId]);

  useEffect(() => {
    if (current) say(current.voice);
  }, [current]);

  const open = (l: GuidedLesson) => {
    s.newDrawing();
    canvasRef.current?.clear();
    setLesson(l);
    setStep(0);
    setDone(false);
  };

  const finish = async () => {
    if (!lesson) return;
    const id = await s.finish();
    if (id) playSound('save-sparkle');
    if (kidId) await setSkill(kidId, guidedSkill(lesson.id), 1).catch((e: unknown) => console.warn('[guided] progress save failed', e));
    setFinished((f) => new Set(f).add(guidedSkill(lesson.id)));
    setDone(true);
  };

  if (!lesson) {
    const card = isTablet ? 240 : (width - space.lg * 3) / 2;
    return (
      <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
        <KidHeader />
        <ScrollView contentContainerStyle={styles.grid}>
          {GUIDED_LESSONS.map((l) => (
            <LessonCard key={l.id} lesson={l} size={card} done={finished.has(guidedSkill(l.id))} onPress={() => open(l)} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <View style={styles.root}>
        <KidHeader
          onHome={() => setLesson(null)}
          left={<IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={() => canvasRef.current?.undo()} />}
          right={
            last ? (
              <PrimaryButton label={isTablet ? "I'm done!" : 'Done'} onPress={() => void finish()} />
            ) : (
              <PrimaryButton label="Next" icon={<ArrowRightIcon color={colors.white} />} onPress={() => setStep((n) => n + 1)} />
            )
          }
        />
        <Text style={styles.stepText}>{current?.text}</Text>
        <View style={styles.center} onLayout={(e) => setBox(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
          <View style={[styles.square, { width: box, height: box }]}>
            {box > 0 ? (
              <DrawingCanvas
                ref={canvasRef}
                doc={s.doc}
                onChange={s.setDoc}
                onStrokeStart={s.markStarted}
                tool={last ? s.tool : 'marker'}
                color={last ? s.color : 'black'}
                size={last ? s.size : 'M'}
                ghost={current?.pathSvg ? { pathSvg: current.pathSvg, opacity: 0.35 } : undefined}
                disabled={done}
              />
            ) : null}
            {points.length > 0 ? <HandHint key={`${lesson.id}-${step}`} points={points} /> : null}
          </View>
        </View>
        {last ? (
          <View style={[styles.panel, styles.tray]}>
            <ToolRail horizontal tools={TOOLS} selected={s.tool} onSelect={s.setTool} />
            <PaletteBar selected={s.color} onSelect={s.setColor} custom={s.custom} />
          </View>
        ) : null}
      </View>
      {done ? (
        <ChoiceBubble
          text="Great job!"
          voiceClip="mascot_great_job"
          choices={[
            { label: 'More lessons', onPress: () => setLesson(null) },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingVertical: space.xl },
  stepText: { fontFamily: fonts.displayMedium, fontSize: fontSize.bubble, color: colors.ink, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  square: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft },
  tray: { paddingVertical: space.md, gap: space.sm },
});
