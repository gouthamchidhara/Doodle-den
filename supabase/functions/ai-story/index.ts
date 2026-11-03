// ai-story (A7 Feature 3): captions, then story; JSON retried once.
import { makeStory } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

Deno.serve(aiHandler('story', (body) => makeStory({ text: textProvider(), image: imageProvider(), mod: moderator() }, parseBody('story', body))));
