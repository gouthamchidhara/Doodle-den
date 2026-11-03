// Guard (A7): JWT → family → consent → entitlement (unless free for all) → daily cap (digest: 7 days).
import { AiError, type Feature } from './contract.ts';
import type { Family, GuardDeps } from './deps.ts';

const DAY_MS = 86_400_000;

// Start of the counting window for a feature.
export function capWindowStart(feature: Feature, now: Date): string {
  if (feature === 'digest') return new Date(now.getTime() - 7 * DAY_MS).toISOString();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

// Runs every check; returns the family or throws AiError with the contract code.
export async function guard(deps: GuardDeps, authorization: string | null, feature: Feature, now = new Date()): Promise<Family> {
  const token = authorization?.replace(/^Bearer\s+/i, '') ?? '';
  const userId = token ? await deps.userIdFromToken(token) : null;
  if (!userId) throw new AiError('UNAUTHORIZED');
  const family = await deps.familyForUser(userId);
  if (!family) throw new AiError('UNAUTHORIZED');
  if (!(await deps.hasConsent(family.id))) throw new AiError('NEEDS_CONSENT');
  const free = (await deps.config<boolean>('ai_free_for_all')) === true;
  if (!free && !family.ai_entitled) throw new AiError('NEEDS_PLAN');
  const caps = (await deps.config<Record<string, number>>('ai_caps_per_day')) ?? {};
  const cap = caps[feature] ?? 0;
  const used = await deps.countUsage(family.id, feature, capWindowStart(feature, now));
  if (used >= cap) {
    await deps.logUsage(family.id, feature, 'cap', 0);
    throw new AiError('CAP_REACHED');
  }
  return family;
}
