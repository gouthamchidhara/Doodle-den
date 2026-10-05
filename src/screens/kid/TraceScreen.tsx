// Trace & Learn (A5): pick a letter/number/shape, trace each stroke in order, earn stars and hear the word.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChipTabs } from '@/components/kid/ChipTabs';
import { IconButton } from '@/components/kid/IconButton';
import { SpeakerIcon } from '@/components/kid/icons/SpeakerIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PressableScale } from '@/components/kid/PressableScale';
import { StarRow } from '@/components/kid/StarRow';
import { traceItems, traceWord, type TraceKind, type TracePath } from '@/content/tracePaths';
import { getProgress, setSkill } from '@/db/repositories/progressRepo';
import { TraceBoard } from '@/games/trace/TraceBoard';
import { TOLERANCE_PX } from '@/games/trace/traceEngine';
import { playSound } from '@/services/audio';
import { say } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';
import { TraceResult } from './trace/TraceResult';

const TABS: { key: TraceKind; label: string }[] = [
  { key: 'letter', label: 'Letters' },
  { key: 'number', label: 'Numbers' },
  { key: 'shape', label: 'Shapes' },
];

// Progress key for an item.
export const traceSkill = (id: string) => `trace_${id}`;

// Trace & Learn screen.
export function TraceScreen() {
  const { isTablet, width, height, ageMode } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  const replay = useIntroVoice('intro_trace');
  const [tab, setTab] = useState<TraceKind>('letter');
  const [current, setCurrent] = useState<TracePath | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const items = traceItems(tab, ageMode);

  useEffect(() => {
    if (!kidId) return;
    getProgress(kidId)
      .then((rows) => setBest(Object.fromEntries(rows.map((r) => [r.skill, r.level]))))
      .catch((e: unknown) => console.warn('[trace] progress failed', e));
  }, [kidId]);

  const start = (p: TracePath) => {
    setCurrent(p);
    setResult(null);
    setAttempt((n) => n + 1);
  };

  const finished = (stars: 1 | 2 | 3) => {
    if (!current) return;
    setResult(stars);
    playSound('star');
    const w = traceWord(current.id);
    if (w) say(w.voice);
    const key = traceSkill(current.id);
    if (kidId && stars > (best[key] ?? 0)) {
      setBest((b) => ({ ...b, [key]: stars }));
      setSkill(kidId, key, stars).catch((e: unknown) => console.warn('[trace] save failed', e));
    }
  };

  const next = () => {
    if (!current) return;
    const list = traceItems(current.kind, ageMode);
    start(list[(list.findIndex((p) => p.id === current.id) + 1) % list.length]);
  };

  const board = Math.min(isTablet ? 620 : width - space.lg * 2, height - 220);
  const tile = isTablet ? 104 : 72;

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader
        onHome={current ? () => setCurrent(null) : undefined}
        right={<IconButton icon={<SpeakerIcon />} accessibilityLabel="Say it again" onPress={() => (current ? say(traceWord(current.id)?.voice ?? 'intro_trace') : replay())} />}
      />
      {current === null ? (
        <View style={styles.flex}>
          <View style={styles.tabs}>
            <ChipTabs tabs={TABS} selected={tab} onSelect={setTab} />
          </View>
          <ScrollView contentContainerStyle={styles.grid}>
            {items.map((p) => (
              <PressableScale key={p.id} accessibilityLabel={`Trace ${p.id}`} onPress={() => start(p)} style={[styles.tile, { width: tile, minHeight: tile + 20 }]}>
                <Text style={[styles.glyph, p.kind === 'shape' && styles.shapeName]}>{p.id}</Text>
                <StarRow count={best[traceSkill(p.id)] ?? 0} size={14} />
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.center}>
          {result === null ? (
            <View style={styles.board}>
              <TraceBoard key={attempt} strokes={current.strokes} size={board} tolerance={TOLERANCE_PX[ageMode]} onDone={finished} />
            </View>
          ) : (
            <TraceResult path={current} word={traceWord(current.id)?.word} stars={result} onAgain={() => start(current)} onNext={next} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  flex: { flex: 1 },
  tabs: { paddingVertical: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingBottom: space.xl },
  tile: { backgroundColor: colors.surface, borderRadius: radius.button, borderWidth: border.normal, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  glyph: { fontFamily: fonts.display, fontSize: fontSize.tileLabel + 6, color: colors.ink },
  shapeName: { fontSize: fontSize.label },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  board: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
});
