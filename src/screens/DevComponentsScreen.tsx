// Dev gallery of shared kid and parent components; not reachable from the kid area.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityTile } from '@/components/kid/ActivityTile';
import { BrushSizeButton } from '@/components/kid/BrushSizeButton';
import { ColorDot } from '@/components/kid/ColorDot';
import { IconButton } from '@/components/kid/IconButton';
import { CheckIcon } from '@/components/kid/icons/CheckIcon';
import { HomeIcon } from '@/components/kid/icons/HomeIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { TimePill } from '@/components/kid/TimePill';
import { ToolButton } from '@/components/kid/ToolButton';
import { colors, drawingPalette, fonts, fontSize, space } from '@/theme/tokens';

// Renders all component states in labelled rows.
export function DevComponentsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h}>IconButton</Text>
      <View style={styles.row}>
        <IconButton icon={<HomeIcon />} accessibilityLabel="Home" />
        <IconButton icon={<UndoIcon />} accessibilityLabel="Undo" size={52} />
      </View>
      <Text style={styles.h}>PrimaryButton</Text>
      <View style={styles.row}>
        <PrimaryButton label="I'm done!" icon={<CheckIcon color={colors.white} />} />
        <PrimaryButton label="Draw a new fish" tone="tomato" />
        <PrimaryButton label="Disabled" disabled />
      </View>
      <Text style={styles.h}>TimePill</Text>
      <View style={styles.row}>
        <TimePill minutesLeft={25} />
        <TimePill minutesLeft={4} />
      </View>
      <Text style={styles.h}>ActivityTile</Text>
      <View style={styles.row}>
        <View style={styles.tile}>
          <ActivityTile title="Free Draw" tint="tomato" icon={<HomeIcon size={120} />} />
        </View>
        <View style={styles.tile}>
          <ActivityTile title="Aquarium" tint="sky" badge="NEW" icon={<HomeIcon size={120} />} />
        </View>
        <View style={styles.tile}>
          <ActivityTile title="Locked" tint="grape" locked icon={<HomeIcon size={120} />} onLockedPress={() => undefined} />
        </View>
      </View>
      <Text style={styles.h}>SpeechBubble</Text>
      <SpeechBubble text="Today's idea: draw a rainbow fish!" />
      <Text style={styles.h}>ToolButton</Text>
      <View style={styles.row}>
        {(['crayon', 'marker', 'watercolor', 'glitter', 'neon', 'stamp', 'eraser'] as const).map((tool, i) => (
          <ToolButton key={tool} tool={tool} selected={i === 0} />
        ))}
      </View>
      <Text style={styles.h}>ColorDot</Text>
      <View style={styles.row}>
        {drawingPalette.map((c, i) => (
          <ColorDot key={c} color={c} selected={i === 0} />
        ))}
        <ColorDot color="rainbow" selected={false} />
      </View>
      <Text style={styles.h}>BrushSizeButton</Text>
      <View style={styles.row}>
        <BrushSizeButton size="L" selected={false} />
        <BrushSizeButton size="M" selected />
        <BrushSizeButton size="S" selected={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  content: { padding: space.xl, gap: space.md },
  h: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.inkMuted, marginTop: space.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  tile: { width: 260 },
});
