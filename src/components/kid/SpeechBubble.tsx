// Mascot speech bubble; plays its voice clip once when shown (A2).
import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { say } from '@/services/voice';
import { border, colors, fonts, fontSize, space } from '@/theme/tokens';

export interface SpeechBubbleProps {
  text: string;
  voiceClip?: string;
  style?: StyleProp<ViewStyle>;
}

// White rounded bubble with medium display text.
export function SpeechBubble({ text, voiceClip, style }: SpeechBubbleProps) {
  useEffect(() => {
    if (voiceClip) say(voiceClip);
  }, [voiceClip]);
  return (
    <View style={[styles.bubble, style]} accessibilityRole="text">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: border.normal,
    borderColor: colors.borderSoft,
    borderRadius: 24,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  text: { fontFamily: fonts.displayMedium, fontSize: fontSize.bubble, color: colors.ink },
});
