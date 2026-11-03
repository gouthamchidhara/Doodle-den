// T-078: every error code maps to the right mascot line; consent/offline checks before calling; B/W threshold.
import { setDbForTesting } from '@/db/database';
import { setMeta } from '@/db/repositories/metaRepo';
import { thresholdBW } from '@/games/coloring/threshold';
import { callAi, mascotLineFor, type AiFailure } from '@/services/ai';
import { setSupabaseForTesting } from '@/services/supabase';

import { createTestDb } from '../helpers/nodeDb';

describe('ai client', () => {
  it('maps every code to the A7 mascot line', () => {
    const table: [AiFailure, string, string][] = [
      ['NEEDS_CONSENT', 'Ask a grown-up to turn on Magic!', 'gate'],
      ['NEEDS_PLAN', 'Ask a grown-up to turn on Magic!', 'gate'],
      ['UNAUTHORIZED', 'Ask a grown-up to turn on Magic!', 'gate'],
      ['CAP_REACHED', "My magic needs a nap. Let's try again tomorrow!", 'back'],
      ['BLOCKED', "Hmm, let's pick a different idea!", 'picker'],
      ['BAD_INPUT', 'Oops, my magic got tangled. Try again?', 'retry'],
      ['PROVIDER_ERROR', 'Oops, my magic got tangled. Try again?', 'retry'],
      ['TIMEOUT', 'Oops, my magic got tangled. Try again?', 'retry'],
      ['OFFLINE', 'Magic needs the internet.', 'back'],
    ];
    for (const [code, text, then] of table) expect(mascotLineFor(code)).toMatchObject({ text, then });
  });

  it('refuses without consent, and without the internet', async () => {
    setDbForTesting(await createTestDb());
    const invoke = jest.fn();
    setSupabaseForTesting({ functions: { invoke }, auth: { getSession: async () => ({ data: { session: {} } }) } } as never);
    expect(await callAi('ai-guess', {})).toEqual({ ok: false, code: 'NEEDS_CONSENT' });
    await setMeta('ai_consent', '1');
    expect(await callAi('ai-guess', {})).toEqual({ ok: false, code: 'OFFLINE' });
    expect(invoke).not.toHaveBeenCalled();
    setSupabaseForTesting(undefined);
  });

  it('thresholds gray to pure black and white', () => {
    const px = Uint8Array.from([100, 100, 100, 255, 200, 200, 200, 255, 0, 0, 0, 0, 150, 160, 170, 255]);
    expect(Array.from(thresholdBW(px))).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
  });
});
