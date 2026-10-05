// Naming a new creature (A5): Big mode = 12 name chips + mic; Little mode = a random name the mascot says.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MicIcon } from '@/components/kid/icons/MicIcon';
import { Mascot } from '@/components/kid/Mascot';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { useSpeechName } from '@/games/mixing/useSpeechName';
import { sayText } from '@/services/voice';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { CREATURE_NAMES, MAX_CREATURE_NAME, randomCreatureName } from './addCreature';

export interface NameCreatureProps {
  big: boolean;
  onDone: (name: string) => void;
}

// Name step shown after "Send it!".
export function NameCreature({ big, onDone }: NameCreatureProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [littleName] = useState(() => randomCreatureName());
  const speech = useSpeechName(MAX_CREATURE_NAME);
  const name = speech.name ?? picked;

  useEffect(() => {
    if (!big) sayText(`I'll call it ${littleName}!`);
  }, [big, littleName]);

  if (!big) {
    return (
      <View style={styles.panel}>
        <Mascot mood="happy" size={96} />
        <Text style={styles.name}>{littleName}</Text>
        <PrimaryButton label="Go!" onPress={() => onDone(littleName)} />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.ask}>What is its name?</Text>
      <View style={styles.row}>
        <Text style={styles.name}>{name ?? '…'}</Text>
        <PressableScale accessibilityLabel="Say a name" onPress={() => void speech.listen()} style={[styles.mic, speech.listening && styles.on]}>
          <MicIcon />
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.chips}>
        {CREATURE_NAMES.slice(0, 12).map((n) => (
          <PressableScale key={n} accessibilityLabel={n} selected={picked === n} onPress={() => (speech.clear(), setPicked(n))} style={[styles.chip, picked === n ? styles.on : styles.off]}>
            <Text style={styles.chipText}>{n}</Text>
          </PressableScale>
        ))}
      </ScrollView>
      <PrimaryButton label="Go!" disabled={!name} onPress={() => name && onDone(name)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center', gap: space.lg, backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.xl, maxWidth: 720 },
  ask: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { fontFamily: fonts.display, fontSize: fontSize.kidHero - 12, color: colors.tomato },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  chip: { minHeight: 56, paddingHorizontal: space.lg, borderRadius: radius.chip, justifyContent: 'center' },
  on: { backgroundColor: colors.tint.tomato.fill, borderWidth: border.thick, borderColor: colors.tomato },
  off: { backgroundColor: colors.surfaceMuted, borderWidth: border.normal, borderColor: 'transparent' },
  chipText: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
  mic: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
});
