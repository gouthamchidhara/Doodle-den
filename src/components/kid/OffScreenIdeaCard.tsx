// Night-colored card with an icon and an off-screen play idea (lock screen).
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { OffScreenIdea } from '@/content/offScreenIdeas';
import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { CloudIcon } from './icons/CloudIcon';
import { CrayonIcon } from './icons/CrayonIcon';
import { HeartIcon } from './icons/HeartIcon';
import { HomeIcon } from './icons/HomeIcon';
import type { IconProps } from './icons/IconProps';
import { JigsawArt } from './icons/JigsawArt';
import { MicIcon } from './icons/MicIcon';
import { MusicArt } from './icons/MusicArt';
import { StoriesArt } from './icons/StoriesArt';
import { SunIcon } from './icons/SunIcon';
import { WandIcon } from './icons/WandIcon';

const ICONS: Record<string, ComponentType<IconProps>> = {
  paper: CrayonIcon,
  fort: HomeIcon,
  outside: SunIcon,
  book: StoriesArt,
  dance: MusicArt,
  blocks: JigsawArt,
  clouds: CloudIcon,
  pretend: WandIcon,
  snack: HeartIcon,
  hug: HeartIcon,
  sing: MicIcon,
  puzzle: JigsawArt,
};

// One idea card.
export function OffScreenIdeaCard({ idea, width }: { idea: OffScreenIdea; width: number }) {
  const Icon = ICONS[idea.icon] ?? SunIcon;
  return (
    <View style={[styles.card, { width }]} accessibilityRole="text" accessibilityLabel={idea.text}>
      <Icon size={56} color={colors.moon} />
      <Text style={styles.text}>{idea.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.nightRaised, borderRadius: radius.panel, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.lg, minHeight: 150 },
  text: { fontFamily: fonts.display, fontSize: fontSize.button, color: colors.white, textAlign: 'center' },
});
