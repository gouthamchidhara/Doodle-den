// Parent unlock sheet on the lock screen (after Parent Gate): +15 min, +30 min, End for today.
import { StyleSheet, Text, View } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import type { ParentUnlockOption } from '@/lock/lockEngine';
import { colors, fonts, fontSize, overlays, radius, space } from '@/theme/tokens';

export interface UnlockSheetProps {
  onPick: (option: ParentUnlockOption) => void;
  onClose: () => void;
}

// Bottom sheet with the three parent choices.
export function UnlockSheet({ onPick, onClose }: UnlockSheetProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.scrim]}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Unlock play</Text>
        <ParentButton label="+15 min" onPress={() => onPick('plus15')} />
        <ParentButton label="+30 min" onPress={() => onPick('plus30')} />
        <ParentButton label="End for today" variant="secondary" onPress={() => onPick('endDay')} />
        <ParentButton label="Cancel" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: overlays.scrim, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 520, backgroundColor: colors.bgParent, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, padding: space.xl, gap: space.md },
  title: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.title, color: colors.ink, marginBottom: space.sm },
});
