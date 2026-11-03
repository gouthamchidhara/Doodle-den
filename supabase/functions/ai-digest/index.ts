// ai-digest (A7 Feature 6): weekly cap (counted over 7 days by the guard).
import { digest } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

Deno.serve(aiHandler('digest', (body) => digest({ text: textProvider(), image: imageProvider(), mod: moderator() }, parseBody('digest', body))));
