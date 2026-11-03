// ai-coach (A7 Feature 5): always an id from the fixed list.
import { coach } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

Deno.serve(aiHandler('coach', (body) => coach({ text: textProvider(), image: imageProvider(), mod: moderator() }, parseBody('coach', body))));
