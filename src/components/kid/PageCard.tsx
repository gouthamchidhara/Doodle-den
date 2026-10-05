// Thumbnail card for a coloring page (picker rows).
import { Image, type ImageSourcePropType, StyleSheet, Text } from 'react-native';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

export interface PageCardProps {
  title: string;
  source: ImageSourcePropType | { uri: string };
  size: number;
  onPress: () => void;
}

// White card with the line art and its title.
export function PageCard({ title, source, size, onPress }: PageCardProps) {
  return (
    <PressableScale accessibilityLabel={title} onPress={onPress} style={[styles.card, { width: size }]}>
      <Image source={source} style={{ width: size - space.lg * 2, height: size - space.lg * 2 }} resizeMode="contain" />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.lg, alignItems: 'center', gap: space.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
});
