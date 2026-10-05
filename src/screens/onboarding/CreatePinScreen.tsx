// Onboarding 2: enter a 4-digit parent PIN twice.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { OnboardingFrame } from '@/components/parent/OnboardingFrame';
import { PinPad } from '@/components/parent/PinPad';
import { setPin } from '@/services/pinService';
import { colors, fonts, fontSize } from '@/theme/tokens';

import { useOnboardingStep } from './useOnboardingStep';

// Two-pass PIN entry; a mismatch shakes and starts over.
export function CreatePinScreen() {
  useOnboardingStep('create-pin');
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const onComplete = async (pin: string) => {
    if (!first) {
      setFirst(pin);
      setError(null);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      setError("PINs don't match");
      setShakeKey((k) => k + 1);
      return;
    }
    setBusy(true);
    try {
      await setPin(pin);
      router.push('/onboarding/add-kid');
    } catch (e) {
      console.warn('[onboarding] setPin failed', e);
      setError('Something went wrong. Try again.');
      setFirst(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame
      title={first ? 'Enter it again' : 'Create a grown-up PIN'}
      subtitle="You will use this 4-digit PIN to open settings and unlock play time."
      onBack={() => router.back()}
    >
      <PinPad onComplete={onComplete} shakeKey={shakeKey} disabled={busy} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  error: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.inkMuted, textAlign: 'center' },
});
