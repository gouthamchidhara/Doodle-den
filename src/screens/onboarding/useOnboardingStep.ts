// Saves the onboarding step on mount; bounces to "/" if onboarding is already done.
import { router } from 'expo-router';
import { useEffect } from 'react';

import { isOnboardingDone, saveStep, type OnboardingStep } from '@/services/onboarding';

// Hook used by every onboarding screen.
export function useOnboardingStep(step: OnboardingStep): void {
  useEffect(() => {
    (async () => {
      if (await isOnboardingDone()) {
        router.replace('/');
        return;
      }
      await saveStep(step);
    })().catch((error: unknown) => console.warn('[onboarding] step save failed', error));
  }, [step]);
}
