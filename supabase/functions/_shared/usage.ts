// Estimated cost per call from COST_* secrets (owner fills real values).
import type { Feature } from './contract.ts';

// e.g. COST_COLORING_PAGE=0.04
export function estCost(feature: Feature): number {
  const v = Number(Deno.env.get(`COST_${feature.toUpperCase()}`) ?? 0);
  return Number.isFinite(v) ? v : 0;
}
