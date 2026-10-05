// System app picker for the Screen Time shield; renders nothing when the flag is off.
import { StyleSheet } from 'react-native';

import { SELECTION_ID, selectionSheet } from './screenTime';

const Sheet = selectionSheet();

// Shows Apple's picker; `onDone` fires when the parent taps Done or Cancel.
export function ScreenTimePicker({ onDone }: { onDone: () => void }) {
  if (!Sheet) return null;
  return <Sheet familyActivitySelectionId={SELECTION_ID} headerText="Tap Doodle Den, then Done." onDismissRequest={onDone} style={styles.sheet} />;
}

const styles = StyleSheet.create({
  sheet: { width: '100%', height: 0 },
});
