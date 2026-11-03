// One router for all AI features: POST /functions/v1/ai/<ai-feature-name>. Same handlers as the per-feature folders.
import { coach, coloringPage, digest, guess, magicSketch, makeStory } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

const p = () => ({ text: textProvider(), image: imageProvider(), mod: moderator() });
const routes: Record<string, (req: Request) => Promise<Response>> = {
  'ai-coloring-page': aiHandler('coloring_page', (b) => coloringPage(p(), parseBody('coloring_page', b))),
  'ai-magic-sketch': aiHandler('magic_sketch', (b) => magicSketch(p(), parseBody('magic_sketch', b))),
  'ai-story': aiHandler('story', (b) => makeStory(p(), parseBody('story', b))),
  'ai-guess': aiHandler('guess', (b) => guess(p(), parseBody('guess', b))),
  'ai-coach': aiHandler('coach', (b) => coach(p(), parseBody('coach', b))),
  'ai-digest': aiHandler('digest', (b) => digest(p(), parseBody('digest', b))),
};

Deno.serve((req) => {
  const name = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  const h = routes[name];
  return h ? h(req) : Promise.resolve(new Response('Not found', { status: 404 }));
});
