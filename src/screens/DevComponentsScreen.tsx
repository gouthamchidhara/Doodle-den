// Dev gallery of shared kid and parent components; not reachable from the kid area.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityTile } from '@/components/kid/ActivityTile';
import { BrushSizeButton } from '@/components/kid/BrushSizeButton';
import { ColorDot } from '@/components/kid/ColorDot';
import { IconButton } from '@/components/kid/IconButton';
import { CheckIcon } from '@/components/kid/icons/CheckIcon';
import { HomeIcon } from '@/components/kid/icons/HomeIcon';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { Mascot } from '@/components/kid/Mascot';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { TimePill } from '@/components/kid/TimePill';
import { ToolButton } from '@/components/kid/ToolButton';
import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { SettingRow } from '@/components/parent/SettingRow';
import { StatRing } from '@/components/parent/StatRing';
import { WeekBars } from '@/components/parent/WeekBars';
import { colors, drawingPalette, fonts, fontSize, space } from '@/theme/tokens';

import { LockNativeDebug } from './LockNativeDebug';

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
      <Text style={styles.h}>Mascot</Text>
      <View style={styles.row}>
        <Mascot mood="idle" />
        <Mascot mood="happy" />
        <Mascot mood="sleepy" />
        <Mascot mood="sleeping" />
      </View>
      <Text style={styles.h}>BrushSizeButton</Text>
      <View style={styles.row}>
        <BrushSizeButton size="L" selected={false} />
        <BrushSizeButton size="M" selected />
        <BrushSizeButton size="S" selected={false} />
      </View>
      <Text style={styles.h}>Lock native</Text>
      <LockNativeDebug />
      <Text style={styles.h}>Parent components</Text>
      <View style={styles.parent}>
        <ParentCard title="Today">
          <StatRing used={32} limit={45} />
        </ParentCard>
        <ParentCard title="Play time this week">
          <WeekBars
            days={['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, minutes: [46, 52, 30, 48, 38, 0, 0][i], isToday: i === 4 }))}
          />
        </ParentCard>
        <ParentCard>
          <SettingRow label="Daily limit" value="45 min" onPress={() => undefined} />
          <SettingRow label="Extra 2 min" toggle={{ value: true, onChange: () => undefined }} last />
        </ParentCard>
        <ParentButton label="Primary" />
        <ParentButton label="Secondary" variant="secondary" />
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
  parent: { width: 390, gap: space.lg, backgroundColor: colors.bgParent, padding: space.lg },
});
