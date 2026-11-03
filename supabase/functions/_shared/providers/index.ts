// Picks providers from Supabase secrets (A7 Providers table).
import { anthropicText } from './anthropic.ts';
import { openaiImage, openaiModerator } from './openai.ts';
import type { ImageProvider, Moderator, TextProvider } from './types.ts';

const env = (k: string, d = '') => Deno.env.get(k) ?? d;

// Text provider (anthropic by default).
export function textProvider(): TextProvider {
  const name = env('AI_TEXT_PROVIDER', 'anthropic');
  if (name === 'anthropic') return anthropicText(env('AI_TEXT_API_KEY'), env('AI_TEXT_MODEL', 'claude-haiku-5-5'));
  throw new Error(`unknown text provider ${name}`);
}

// Image provider (openai by default).
export function imageProvider(): ImageProvider {
  const name = env('AI_IMAGE_PROVIDER', 'openai');
  if (name === 'openai') return openaiImage(env('AI_IMAGE_API_KEY'), env('AI_IMAGE_MODEL', 'gpt-image-1'));
  throw new Error(`unknown image provider ${name}`);
}

// Moderator (openai by default).
export function moderator(): Moderator {
  const name = env('AI_MODERATION_PROVIDER', 'openai');
  if (name === 'openai') return openaiModerator(env('AI_IMAGE_API_KEY'));
  throw new Error(`unknown moderation provider ${name}`);
}

export type { ImageProvider, Moderator, TextProvider };
