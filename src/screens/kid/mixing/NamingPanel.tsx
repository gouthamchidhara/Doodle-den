// Name Your Colors: one word from each chip row (Big mode can also say a name with the mic).
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MicIcon } from '@/components/kid/icons/MicIcon';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { colorName, FIRST_WORDS, SECOND_WORDS } from '@/content/colorNames';
import { useSpeechName } from '@/games/mixing/useSpeechName';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

export interface NamingPanelProps {
  color: string;
  big: boolean;
  onSave: (name: string) => void;
}

// Word chip.
function Chip({ word, on, onPress }: { word: string; on: boolean; onPress: () => void }) {
  return (
    <PressableScale accessibilityLabel={word} selected={on} onPress={onPress} style={[styles.chip, on ? styles.on : styles.off]}>
      <Text style={styles.chipText}>{word}</Text>
    </PressableScale>
  );
}

// Naming panel under the bowl.
export function NamingPanel({ color, big, onSave }: NamingPanelProps) {
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  const speech = useSpeechName();
  const name = speech.name ?? (first && second ? colorName(first, second) : null);

  return (
    <View style={styles.panel}>
      <View style={styles.title}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text style={styles.name}>{name ?? 'Give it a name!'}</Text>
        {big ? (
          <PressableScale accessibilityLabel="Say a name" onPress={() => void speech.listen()} style={[styles.mic, speech.listening && styles.on]}>
            <MicIcon />
          </PressableScale>
        ) : null}
      </View>
      {speech.blocked ? <Text style={styles.hint}>{"Let's pick words instead!"}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FIRST_WORDS.map((w) => (
          <Chip key={w} word={w} on={first === w} onPress={() => (speech.clear(), setFirst(w))} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SECOND_WORDS.map((w) => (
          <Chip key={w} word={w} on={second === w} onPress={() => (speech.clear(), setSecond(w))} />
        ))}
      </ScrollView>
      <PrimaryButton label="Save my color" disabled={!name} onPress={() => name && onSave(name)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.lg, gap: space.md, alignItems: 'center', maxWidth: 760, width: '100%' },
  title: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: border.normal, borderColor: colors.ink },
  name: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
  row: { gap: space.sm, paddingHorizontal: space.sm },
  chip: { minHeight: 52, paddingHorizontal: space.lg, borderRadius: radius.chip, justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  chipText: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
  mic: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
});
