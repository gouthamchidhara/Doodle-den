// delete-account (A5 Account, T-097): removes the family's storage files, rows (cascade) and the auth user.
import { CORS, json } from '../_shared/contract.ts';
import { serviceClient } from '../_shared/deps.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const sb = serviceClient();
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: u } = await sb.auth.getUser(token);
  if (!u.user) return json({ ok: false, code: 'UNAUTHORIZED' }, 401);
  const { data: fam } = await sb.from('family').select('id').eq('parent_user_id', u.user.id).maybeSingle();
  if (fam) {
    // Storage: art/<family_id>/<kid_id>/<artwork>.png
    const { data: kids } = await sb.storage.from('art').list(fam.id, { limit: 1000 });
    for (const k of kids ?? []) {
      const { data: files } = await sb.storage.from('art').list(`${fam.id}/${k.name}`, { limit: 1000 });
      const paths = (files ?? []).map((f: { name: string }) => `${fam.id}/${k.name}/${f.name}`);
      if (paths.length) await sb.storage.from('art').remove(paths);
    }
    await sb.from('family').delete().eq('id', fam.id);
  }
  const { error } = await sb.auth.admin.deleteUser(u.user.id);
  if (error) return json({ ok: false, code: 'PROVIDER_ERROR' }, 500);
  return json({ ok: true });
});
