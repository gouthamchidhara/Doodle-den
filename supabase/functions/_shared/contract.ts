// Response contract shared by every AI function (A7).
export type AiCode = 'NEEDS_CONSENT' | 'NEEDS_PLAN' | 'CAP_REACHED' | 'BLOCKED' | 'BAD_INPUT' | 'PROVIDER_ERROR' | 'UNAUTHORIZED';
export type AiResponse<T> = { ok: true; id: string; data: T } | { ok: false; code: AiCode };
export type Feature = 'coloring_page' | 'magic_sketch' | 'story' | 'guess' | 'coach' | 'digest';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JSON response with CORS headers.
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// Error response in the contract shape (always HTTP 200 so the app reads the code).
export function fail(code: AiCode): Response {
  return json({ ok: false, code });
}

// Thrown inside a feature to stop with a contract code.
export class AiError extends Error {
  constructor(readonly code: AiCode) {
    super(code);
  }
}
