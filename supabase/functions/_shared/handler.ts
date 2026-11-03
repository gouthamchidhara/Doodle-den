// Shared request flow for every AI function (A7 Architecture steps 2–8).
import { AiError, CORS, fail, json, type Feature } from './contract.ts';
import { supabaseDeps, type GuardDeps } from './deps.ts';
import { guard } from './guard.ts';
import { estCost } from './usage.ts';

// Wraps a feature: CORS, guard, run, usage row, contract response.
export function aiHandler<T>(feature: Feature, run: (body: unknown) => Promise<T>, makeDeps: () => GuardDeps = supabaseDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    const deps = makeDeps();
    let familyId: string | null = null;
    try {
      const family = await guard(deps, req.headers.get('Authorization'), feature);
      familyId = family.id;
      const body = await req.json().catch(() => null);
      const data = await run(body);
      await deps.logUsage(family.id, feature, 'ok', estCost(feature));
      return json({ ok: true, id: crypto.randomUUID(), data });
    } catch (e) {
      const code = e instanceof AiError ? e.code : 'PROVIDER_ERROR';
      if (familyId && code !== 'CAP_REACHED') await deps.logUsage(familyId, feature, code === 'BLOCKED' ? 'blocked' : 'error', 0).catch(() => undefined);
      if (!(e instanceof AiError)) console.error(`[${feature}]`, e);
      return fail(code);
    }
  };
}
