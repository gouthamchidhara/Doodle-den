// App start routing (A5 "App start & routing"): onboarding → locked → profile picker → Kid Home.
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { listKids } from '@/db/repositories/kidRepo';
import type { KidProfile } from '@/types/models';

export type StartRoute = '/onboarding/welcome' | `/onboarding/${string}` | '/locked' | '/profiles' | '/home';

export interface StartupState {
  onboardingDone: boolean;
  onboardingStep: string | null;
  locked: boolean;
  kids: KidProfile[];
  activeKid: KidProfile | null;
}

const ONBOARDING_STEPS: readonly string[] = ['welcome', 'create-pin', 'add-kid', 'time-rules', 'device-lock-tips', 'finish'];

// Pure routing decision from the startup state (rules 2-5).
export function decideStartRoute(s: StartupState): StartRoute {
  if (!s.onboardingDone) {
    return s.onboardingStep && ONBOARDING_STEPS.includes(s.onboardingStep) ? `/onboarding/${s.onboardingStep}` : '/onboarding/welcome';
  }
  if (s.locked) return '/locked';
  if (!s.activeKid && s.kids.length > 1) return '/profiles';
  return '/home';
}

// Reads meta + kids, picks the active kid (the only kid when there is just one) and asks the lock whether it is locked.
export async function loadStartupState(isLocked: (kidId: string) => Promise<boolean>): Promise<StartupState> {
  const [done, step, activeId, kids] = await Promise.all([
    getMeta('onboarding_done'),
    getMeta('onboarding_step'),
    getMeta('active_kid_id'),
    listKids(),
  ]);
  let activeKid = kids.find((k) => k.id === activeId) ?? null;
  if (!activeKid && kids.length === 1) {
    activeKid = kids[0];
    await setMeta('active_kid_id', activeKid.id);
  }
  const locked = activeKid ? await isLocked(activeKid.id) : false;
  return { onboardingDone: done === 'true', onboardingStep: step, locked, kids, activeKid };
}
