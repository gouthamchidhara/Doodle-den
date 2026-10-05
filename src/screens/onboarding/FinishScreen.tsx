// Onboarding end: optional parent account (added in T-071), then start playing.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { OnboardingFrame } from '@/components/parent/OnboardingFrame';
import { finishOnboarding } from '@/services/onboarding';
import { colors, fonts, fontSize } from '@/theme/tokens';

import { useOnboardingStep } from './useOnboardingStep';

// Marks onboarding done and goes to the start router.
export function FinishScreen() {
  useOnboardingStep('finish');
  const [busy, setBusy] = useState(false);
  const done = async () => {
    setBusy(true);
    try {
      await finishOnboarding();
      router.replace('/');
    } catch (e) {
      console.warn('[onboarding] finish failed', e);
      setBusy(false);
    }
  };
  return (
    <OnboardingFrame title="All set!" onBack={() => router.back()} nextLabel="Skip for now" onNext={done} nextDisabled={busy}>
      <Text style={styles.text}>A parent account is optional. It lets you back up art, turn on Magic and share a Family Gallery. You can add it later in the grown-up zone.</Text>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
});
