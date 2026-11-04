// Picks providers from Supabase secrets (A7 Providers table).
import { anthropicText } from './anthropic.ts';
import { geminiImage, geminiModerator } from './gemini.ts';
import { mimoText } from './mimo.ts';
import { openaiImage, openaiModerator } from './openai.ts';
import type { ImageProvider, Moderator, TextProvider } from './types.ts';

const env = (k: string, d = '') => Deno.env.get(k) ?? d;

// Text provider (anthropic by default; mimo = Xiaomi MiMo on the dedicated endpoint).
export function textProvider(): TextProvider {
  const name = env('AI_TEXT_PROVIDER', 'anthropic');
  if (name === 'anthropic') return anthropicText(env('AI_TEXT_API_KEY'), env('AI_TEXT_MODEL', 'claude-haiku-5-5'));
  if (name === 'mimo') {
    return mimoText(
      env('AI_TEXT_API_KEY'),
      env('AI_TEXT_MODEL', 'mimo-v2.6-flash'),
      env('AI_MIMO_BASE_URL', 'https://token-plan-sgp.xiaomimimo.com/v1'),
    );
  }
  throw new Error(`unknown text provider ${name}`);
}

// Image provider (gemini = Google Gemini 2.5 Flash Image, openai = gpt-image-1).
export function imageProvider(): ImageProvider {
  const name = env('AI_IMAGE_PROVIDER', 'gemini');
  if (name === 'gemini') return geminiImage(env('AI_IMAGE_API_KEY'), env('AI_IMAGE_MODEL', 'gemini-2.5-flash-image'));
  if (name === 'openai') return openaiImage(env('AI_IMAGE_API_KEY'), env('AI_IMAGE_MODEL', 'gpt-image-1'));
  throw new Error(`unknown image provider ${name}`);
}

// Moderator (openai free moderation endpoint is best; gemini = flash-lite judge).
export function moderator(): Moderator {
  const name = env('AI_MODERATION_PROVIDER', 'openai');
  if (name === 'openai') return openaiModerator(env('AI_MODERATION_API_KEY') || env('AI_IMAGE_API_KEY'));
  if (name === 'gemini') return geminiModerator(env('AI_MODERATION_API_KEY') || env('AI_IMAGE_API_KEY'), env('AI_MODERATION_MODEL', 'gemini-2.5-flash-lite'));
  throw new Error(`unknown moderation provider ${name}`);
}

export type { ImageProvider, Moderator, TextProvider };
