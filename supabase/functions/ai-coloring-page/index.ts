// ai-coloring-page (A7 Feature 1).
import { coloringPage } from '../_shared/features.ts';
import { aiHandler } from '../_shared/handler.ts';
import { imageProvider, moderator, textProvider } from '../_shared/providers/index.ts';
import { parseBody } from '../_shared/validate.ts';

Deno.serve(aiHandler('coloring_page', (body) => coloringPage({ text: textProvider(), image: imageProvider(), mod: moderator() }, parseBody('coloring_page', body))));
