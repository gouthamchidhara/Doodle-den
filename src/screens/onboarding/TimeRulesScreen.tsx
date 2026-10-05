// Onboarding 4: daily limit, per-session limit, bedtime.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { OnboardingFrame } from '@/components/parent/OnboardingFrame';
import { TimeRulesForm } from '@/components/parent/TimeRulesForm';
import { defaultRules, getRules, saveRules } from '@/db/repositories/rulesRepo';
import { getOnboardingKid } from '@/services/onboarding';
import type { TimeRules } from '@/types/models';

import { useOnboardingStep } from './useOnboardingStep';

// Loads the onboarding kid's rules (defaults) and saves them on Next.
export function TimeRulesScreen() {
  useOnboardingStep('time-rules');
  const [rules, setRules] = useState<TimeRules | null>(null);

  useEffect(() => {
    (async () => {
      const kid = await getOnboardingKid();
      if (!kid) {
        router.replace('/onboarding/add-kid');
        return;
      }
      setRules(await getRules(kid.id));
    })().catch((e: unknown) => {
      console.warn('[onboarding] load rules failed', e);
      setRules(defaultRules(''));
    });
  }, []);

  const onNext = async () => {
    if (!rules) return;
    try {
      await saveRules(rules);
      router.push('/onboarding/device-lock-tips');
    } catch (e) {
      console.warn('[onboarding] save rules failed', e);
    }
  };

  return (
    <OnboardingFrame
      title="How much play time?"
      subtitle="You can change these any time in the grown-up zone."
      onBack={() => router.back()}
      onNext={onNext}
      nextDisabled={!rules}
    >
      {rules ? <TimeRulesForm rules={rules} onChange={setRules} /> : null}
    </OnboardingFrame>
  );
}
