// Guided lesson card: preview of all step paths + title (+ a check star when finished).
import { StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { GuidedLesson } from '@/content/guidedLessons';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { PressableScale } from './PressableScale';
import { StarRow } from './StarRow';

// One lesson in the picker grid.
export function LessonCard({ lesson, size, done, onPress }: { lesson: GuidedLesson; size: number; done: boolean; onPress: () => void }) {
  const art = size - space.lg * 2;
  return (
    <PressableScale accessibilityLabel={lesson.title} onPress={onPress} style={[styles.card, { width: size }]}>
      <Svg width={art} height={art} viewBox="0 0 1 1">
        {lesson.steps
          .filter((s) => s.pathSvg)
          .map((s) => (
            <Path key={s.voice} d={s.pathSvg} stroke={colors.ink} strokeWidth={0.02} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
      </Svg>
      <Text style={styles.title}>{lesson.title}</Text>
      {done ? <StarRow count={3} size={16} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.tint.grape.border, padding: space.lg, alignItems: 'center', gap: space.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
});
