// Parent zone → Device lock (A5): Android pinning toggle; iOS Guided Access steps and status; extra iOS lock when enabled.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { SettingRow } from '@/components/parent/SettingRow';
import { GUIDED_ACCESS_STEPS } from '@/content/deviceLock';
import { isPinned, startPinning, stopPinning } from '@/lock/devicePinning';
import { isScreenTimeEnabled } from '@/lock/screenTime';
import { colors, fonts, fontSize, space } from '@/theme/tokens';

// Device lock settings (reachable only through the Parent Gate).
export function DeviceLockScreen() {
  const [pinned, setPinned] = useState(isPinned());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setPinned(isPinned());
    });
    return () => sub.remove();
  }, []);

  const togglePin = async (on: boolean) => {
    if (on) setPinned(await startPinning());
    else {
      await stopPinning();
      setPinned(isPinned());
    }
  };

  return (
    <ParentScreen title="Device lock" subtitle="Keep play inside Doodle Den.">
      {Platform.OS === 'android' ? (
        <ParentCard title="Android">
          <SettingRow label="Keep my child in the app" toggle={{ value: pinned, onChange: (v) => void togglePin(v) }} last />
          <Text style={styles.note}>Android asks you to confirm. While pinned, Home and Recents are blocked. To leave, open Grown-ups, enter your PIN and turn this off.</Text>
        </ParentCard>
      ) : (
        <>
          <ParentCard title="Guided Access">
            <Text style={[styles.status, pinned ? styles.on : styles.off]}>{pinned ? 'Guided Access is on' : 'Guided Access is off'}</Text>
            {GUIDED_ACCESS_STEPS.map((s, i) => (
              <View key={s} style={styles.step}>
                <Text style={styles.num}>{i + 1}.</Text>
                <Text style={styles.note}>{s}</Text>
              </View>
            ))}
            <ParentButton label="Open Settings" variant="secondary" onPress={() => Linking.openSettings().catch(() => undefined)} />
          </ParentCard>
          {isScreenTimeEnabled() ? (
            <ParentCard title="Extra iOS lock">
              <SettingRow label="Screen Time shield" value="Set up" onPress={() => router.push('/parent/screen-time')} last />
              <Text style={styles.note}>Uses Apple Screen Time to cover other apps when play time is over.</Text>
            </ParentCard>
          ) : null}
        </>
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: space.sm },
  num: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.ink },
  note: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
  status: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body },
  on: { color: colors.leaf },
  off: { color: colors.inkMuted },
});
