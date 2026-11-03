// Family Gallery (A7): GET ?t=<token> → simple HTML grid of the family's shared art (signed URLs, 60 min). No login, no names.
import { serviceClient } from '../_shared/deps.ts';

const OFF = '<!doctype html><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width"><p style="font-family:sans-serif">This link is turned off.</p>';
const page = (cells: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width"><title>Our art</title><style>body{font-family:sans-serif;background:#EEF6F0;color:#1F2A44;margin:24px}h1{font-size:28px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}.c{background:#fff;border-radius:18px;padding:10px}.c img{width:100%;border-radius:10px}.d{font-size:13px;color:#4A5570;margin-top:6px}</style></head><body><h1>Our art</h1><div class="g">${cells}</div></body></html>`;
const html = (body: string, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('t') ?? '';
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return html(OFF, 404);
  const sb = serviceClient();
  const { data: share } = await sb.from('family_share').select('family_id').eq('token', token).is('revoked_at', null).maybeSingle();
  if (!share) return html(OFF, 404);
  const { data: kids } = await sb.from('kid_profile').select('id').eq('family_id', share.family_id);
  const kidIds = (kids ?? []).map((k: { id: string }) => k.id);
  if (kidIds.length === 0) return html(page(''));
  const { data: arts } = await sb.from('artwork').select('storage_path, created_at').in('kid_id', kidIds).eq('family_shared', true).order('created_at', { ascending: false }).limit(60);
  const cells: string[] = [];
  for (const a of arts ?? []) {
    const { data: signed } = await sb.storage.from('art').createSignedUrl(a.storage_path, 3600);
    if (!signed) continue;
    const date = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    cells.push(`<div class="c"><img src="${signed.signedUrl}" alt="A drawing"><div class="d">${date}</div></div>`);
  }
  return html(page(cells.join('')));
});
