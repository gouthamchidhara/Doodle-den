// Finish card: big glyph, "A is for apple", stars, and Again / Next buttons.
import { StyleSheet, Text, View } from 'react-native';

import { Mascot } from '@/components/kid/Mascot';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { StarRow } from '@/components/kid/StarRow';
import type { TracePath } from '@/content/tracePaths';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

export interface TraceResultProps {
  path: TracePath;
  word: string | undefined;
  stars: number;
  onAgain: () => void;
  onNext: () => void;
}

// Sentence on the card.
export function resultLine(path: TracePath, word: string | undefined): string {
  if (!word) return 'Great job!';
  if (path.kind === 'letter') return `${path.id} is for ${word}!`;
  if (path.kind === 'number') return `${path.id}: ${word}!`;
  return `A ${word}!`;
}

// The result card.
export function TraceResult({ path, word, stars, onAgain, onNext }: TraceResultProps) {
  return (
    <View style={styles.wrap}>
      <Mascot mood="happy" size={96} />
      <View style={styles.card}>
        <Text style={styles.glyph}>{path.kind === 'shape' ? '★' : path.id}</Text>
        <Text style={styles.word}>{resultLine(path, word)}</Text>
        <StarRow count={stars} size={44} />
      </View>
      <View style={styles.row}>
        <PrimaryButton label="Again" tone="tomato" onPress={onAgain} />
        <PrimaryButton label="Next" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.tile, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.xl, alignItems: 'center', gap: space.md, minWidth: 260 },
  glyph: { fontFamily: fonts.display, fontSize: fontSize.kidHero * 2, color: colors.leaf },
  word: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink, textAlign: 'center' },
  row: { flexDirection: 'row', gap: space.lg },
});
