// Mascot question bubble with big answer buttons (e.g. "Start fresh?" Yes / No).
import { StyleSheet, View } from 'react-native';

import { overlays, space } from '@/theme/tokens';

import { Mascot } from './Mascot';
import { PrimaryButton } from './PrimaryButton';
import { SpeechBubble } from './SpeechBubble';

export interface Choice {
  label: string;
  onPress: () => void;
  tone?: 'leaf' | 'tomato';
}

export interface ChoiceBubbleProps {
  text: string;
  voiceClip?: string;
  choices: Choice[];
}

// Full-screen dim with the mascot asking a question.
export function ChoiceBubble({ text, voiceClip, choices }: ChoiceBubbleProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.dim]}>
      <View style={styles.card}>
        <Mascot mood="happy" size={96} />
        <SpeechBubble text={text} voiceClip={voiceClip} />
        <View style={styles.row}>
          {choices.map((c) => (
            <PrimaryButton key={c.label} label={c.label} tone={c.tone} onPress={c.onPress} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: overlays.scrim, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { alignItems: 'center', gap: space.lg },
  row: { flexDirection: 'row', gap: space.lg },
});
