// ai-guess (A7 Feature 4).
import { guess } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

Deno.serve(aiHandler('guess', (body) => guess({ text: textProvider(), image: imageProvider(), mod: moderator() }, parseBody('guess', body))));
