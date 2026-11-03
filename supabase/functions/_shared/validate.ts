// Request validation (A7): zod schemas per feature; images over 1.5 MB of base64 are rejected.
import { z } from 'npm:zod@4';

import { AiError } from './contract.ts';

export const MAX_IMAGE_B64 = 1_500_000;
const ageMode = z.enum(['little', 'big']);
const image = z.string().min(16).max(MAX_IMAGE_B64);

export const schemas = {
  coloring_page: z
    .object({
      ageMode,
      tiles: z.object({ who: z.string(), doing: z.string().optional(), where: z.string().optional() }).optional(),
      spokenText: z.string().min(1).max(80).optional(),
    })
    .refine((b) => (b.tiles ? 1 : 0) + (b.spokenText ? 1 : 0) === 1),
  magic_sketch: z.object({ ageMode, imageBase64: image }),
  story: z.object({ ageMode, images: z.array(image).min(1).max(4), heroName: z.string().max(12).optional() }),
  guess: z.object({ ageMode, imageBase64: image }),
  coach: z.object({ ageMode, imageBase64: image }),
  digest: z.object({
    week: z.object({
      minutesPerDay: z.array(z.number().min(0)).length(7),
      dailyLimitMin: z.number().min(0),
      activities: z.record(z.string(), z.number().min(0)),
      artworkCount: z.number().min(0),
      newColorsNamed: z.number().min(0),
      lettersTraced: z.array(z.string().max(2)).max(52),
      storiesMade: z.number().min(0),
    }),
  }),
};

// Parses a body or throws BAD_INPUT.
export function parseBody<K extends keyof typeof schemas>(feature: K, body: unknown): z.infer<(typeof schemas)[K]> {
  const r = schemas[feature].safeParse(body);
  if (!r.success) throw new AiError('BAD_INPUT');
  return r.data as z.infer<(typeof schemas)[K]>;
}
