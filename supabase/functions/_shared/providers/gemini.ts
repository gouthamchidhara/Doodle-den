// Google Gemini image adapter (AI_IMAGE_PROVIDER=gemini): generate + edit via generateContent.
// Model: gemini-2.5-flash-image ("nano banana"), 1:1 default output. Edit = image + prompt in one turn.
import { fetchWithTimeout } from './timeout.ts';
import type { ImageProvider, Moderator } from './types.ts';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// generateContent client; returns first inline image as base64.
export function geminiImage(apiKey: string, model: string): ImageProvider {
  const call = async (parts: unknown[]): Promise<string> => {
    const res = await fetchWithTimeout(`${BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
      }),
    });
    if (!res.ok) throw new Error(`gemini image ${res.status}`);
    const body = await res.json();
    const out = (body.candidates?.[0]?.content?.parts ?? [])
      .find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
    if (!out) throw new Error('gemini image: no image in response');
    return out.inlineData.data as string;
  };
  return {
    generate: ({ prompt }) => call([{ text: prompt }]),
    edit: ({ prompt, imageBase64 }) => call([
      { inlineData: { mimeType: 'image/png', data: imageBase64 } },
      { text: prompt },
    ]),
  };
}

// Moderation via a cheap Gemini text/vision model (true = safe). Prefer openai
// moderation (free dedicated endpoint) when a key is available.
export function geminiModerator(apiKey: string, model: string): Moderator {
  const call = async (parts: unknown[]): Promise<boolean> => {
    const res = await fetchWithTimeout(`${BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [
        ...parts,
        { text: 'Is this content safe for a kids app (ages 5-8)? Reply with exactly SAFE or UNSAFE.' },
      ] }] }),
    });
    if (!res.ok) throw new Error(`gemini moderation ${res.status}`);
    const body = await res.json();
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '').join('').trim().toUpperCase();
    return text.includes('SAFE') && !text.includes('UNSAFE');
  };
  return {
    text: (input) => call([{ text: input }]),
    image: (b64) => call([{ inlineData: { mimeType: 'image/png', data: b64 } }]),
  };
}
