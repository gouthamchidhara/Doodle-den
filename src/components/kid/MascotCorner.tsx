// Small mascot in a canvas corner; tapping shows a bubble (ideas now, AI Guess/Idea/Magic bubbles after T-079/T-080).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';

import { Mascot, type MascotMood } from './Mascot';
import { PressableScale } from './PressableScale';
import { SpeechBubble } from './SpeechBubble';

export interface MascotCornerProps {
  bubble: { text: string; voice?: string; id: number } | null;
  onPress: () => void;
  mood?: MascotMood;
  onBubbleDone?: () => void;
}

const BUBBLE_MS = 5000;

// Bottom-right mascot (48 px) with an optional bubble that hides after 5 s.
export function MascotCorner({ bubble, onPress, mood = 'idle', onBubbleDone }: MascotCornerProps) {
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!bubble) return undefined;
    const t = setTimeout(() => {
      setShown(bubble.id);
      onBubbleDone?.();
    }, BUBBLE_MS);
    return () => clearTimeout(t);
  }, [bubble, onBubbleDone]);
  const visible = bubble && shown !== bubble.id;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {visible ? <SpeechBubble key={bubble.id} text={bubble.text} voiceClip={bubble.voice} style={styles.bubble} /> : null}
      <PressableScale accessibilityLabel="Crayon friend" sound="bubble" onPress={onPress}>
        <Mascot mood={mood} size={48} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: space.md, bottom: space.md, alignItems: 'flex-end', gap: space.sm },
  bubble: { maxWidth: 280 },
});
