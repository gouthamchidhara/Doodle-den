// Thumbnail card for a coloring page (picker rows).
import { Image, type ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { PadlockIcon } from './icons/PadlockIcon';
import { PressableScale } from './PressableScale';

export interface PageCardProps {
  title: string;
  source: ImageSourcePropType | { uri: string };
  size: number;
  onPress: () => void;
  locked?: boolean;
}

// White card with the line art and its title.
export function PageCard({ title, source, size, onPress, locked }: PageCardProps) {
  return (
    <PressableScale accessibilityLabel={locked ? `${title}, ask a grown-up` : title} onPress={onPress} style={[styles.card, { width: size }]}>
      <Image source={source} style={{ width: size - space.lg * 2, height: size - space.lg * 2 }} resizeMode="contain" />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {locked ? (
        <View style={styles.lock}>
          <PadlockIcon size={28} />
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.lg, alignItems: 'center', gap: space.sm },
  lock: { position: 'absolute', top: space.sm, right: space.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
});
