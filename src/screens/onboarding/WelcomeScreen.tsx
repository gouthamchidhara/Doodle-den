// Onboarding 1: app name, mascot, promise line.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Mascot } from '@/components/kid/Mascot';
import { OnboardingFrame } from '@/components/parent/OnboardingFrame';
import { APP_NAME } from '@/content/app';
import { colors, fonts, fontSize } from '@/theme/tokens';

import { useOnboardingStep } from './useOnboardingStep';

// Welcome screen with the "Set up for my child" button.
export function WelcomeScreen() {
  useOnboardingStep('welcome');
  return (
    <OnboardingFrame title={APP_NAME} nextLabel="Set up for my child" onNext={() => router.push('/onboarding/create-pin')}>
      <View style={styles.center}>
        <Mascot mood="happy" size={140} />
        <Text style={styles.line}>Creative play that knows when to stop.</Text>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  line: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.ink, textAlign: 'center' },
});
