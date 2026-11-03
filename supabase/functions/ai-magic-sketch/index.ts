// ai-magic-sketch (A7 Feature 2).
import { magicSketch } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

Deno.serve(aiHandler('magic_sketch', (body) => magicSketch({ text: textProvider(), image: imageProvider(), mod: moderator() }, parseBody('magic_sketch', body))));
