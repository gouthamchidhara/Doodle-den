// Onboarding progress in app_meta so a killed app resumes on the same screen (A5 Onboarding).
import { getKid } from '@/db/repositories/kidRepo';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { useSessionStore } from '@/state/sessionStore';
import type { KidProfile } from '@/types/models';

export type OnboardingStep = 'welcome' | 'create-pin' | 'add-kid' | 'time-rules' | 'device-lock-tips' | 'finish';

// Remembers the current onboarding screen.
export async function saveStep(step: OnboardingStep): Promise<void> {
  await setMeta('onboarding_step', step);
}

// True once onboarding has been completed (it can never run twice).
export async function isOnboardingDone(): Promise<boolean> {
  return (await getMeta('onboarding_done')) === 'true';
}

// Remembers the kid created during onboarding.
export async function setOnboardingKid(kidId: string): Promise<void> {
  await setMeta('onboarding_kid_id', kidId);
}

// The kid created during onboarding, if any.
export async function getOnboardingKid(): Promise<KidProfile | null> {
  const id = await getMeta('onboarding_kid_id');
  return id ? getKid(id) : null;
}

// Marks onboarding done and makes the onboarding kid active.
export async function finishOnboarding(): Promise<void> {
  const kid = await getOnboardingKid();
  if (kid) {
    await setMeta('active_kid_id', kid.id);
    useSessionStore.getState().setActiveKid(kid.id, kid.ageMode);
  }
  await setMeta('onboarding_done', 'true');
  await setMeta('onboarding_step', 'finish');
}
