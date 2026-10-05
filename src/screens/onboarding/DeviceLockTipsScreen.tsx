// Onboarding 5: how to keep the child inside the app (Guided Access on iOS, pinning on Android).
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { OnboardingFrame } from '@/components/parent/OnboardingFrame';
import { SettingRow } from '@/components/parent/SettingRow';
import { GUIDED_ACCESS_STEPS } from '@/content/deviceLock';
import { isPinned, startPinning, stopPinning } from '@/lock/devicePinning';
import { colors, fonts, fontSize } from '@/theme/tokens';

import { useOnboardingStep } from './useOnboardingStep';

// Platform-specific tips; Android can pin the app right here.
export function DeviceLockTipsScreen() {
  useOnboardingStep('device-lock-tips');
  const [pinned, setPinned] = useState(isPinned());

  const togglePin = async (on: boolean) => {
    if (on) setPinned(await startPinning());
    else {
      await stopPinning();
      setPinned(false);
    }
  };

  return (
    <OnboardingFrame title="Keep play inside the app" onBack={() => router.back()} onNext={() => router.push('/onboarding/finish')}>
      {Platform.OS === 'ios' ? (
        <ParentCard title="Turn on Guided Access">
          {GUIDED_ACCESS_STEPS.map((s, i) => (
            <View key={s} style={styles.step}>
              <Text style={styles.num}>{i + 1}.</Text>
              <Text style={styles.text}>{s}</Text>
            </View>
          ))}
          <ParentButton label="Open Settings" variant="secondary" onPress={() => Linking.openSettings().catch(() => undefined)} />
        </ParentCard>
      ) : (
        <ParentCard title="Android">
          <SettingRow label="Keep my child in the app" toggle={{ value: pinned, onChange: (v) => void togglePin(v) }} last />
          <Text style={styles.text}>Android will ask you to confirm. To leave, open the grown-up zone and enter your PIN.</Text>
        </ParentCard>
      )}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 8 },
  num: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.ink },
  text: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
});
