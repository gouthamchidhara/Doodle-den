// RevenueCat webhook (A7 Paid-later switch): sets family.ai_entitled from the ai_magic entitlement.
import { serviceClient } from '../_shared/deps.ts';

const ON = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'];

Deno.serve(async (req) => {
  if (req.headers.get('Authorization') !== Deno.env.get('RC_WEBHOOK_SECRET')) return new Response('unauthorized', { status: 401 });
  const body = await req.json().catch(() => null);
  const ev = body?.event;
  const familyId: string | undefined = ev?.app_user_id;
  if (!ev || !familyId) return new Response('ok');
  const ids: string[] = ev.entitlement_ids ?? [];
  let entitled: boolean | null = null;
  if (ON.includes(ev.type)) entitled = ids.includes('ai_magic') ? true : null;
  if (ev.type === 'EXPIRATION' && (ids.length === 0 || ids.includes('ai_magic'))) entitled = false;
  if (entitled !== null) {
    const sb = serviceClient();
    await sb.from('family').update({ ai_entitled: entitled, plan: entitled ? 'family' : 'free' }).eq('id', familyId);
  }
  return new Response('ok');
});
