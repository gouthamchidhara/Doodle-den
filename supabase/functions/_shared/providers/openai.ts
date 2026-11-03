// OpenAI image (generate/edit) and moderation adapters (defaults for AI_IMAGE_PROVIDER / AI_MODERATION_PROVIDER).
import { fetchWithTimeout } from './timeout.ts';
import type { ImageProvider, Moderator } from './types.ts';

// Base64 → Blob for multipart upload.
function pngBlob(b64: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

// Image generation / edit client.
export function openaiImage(apiKey: string, model: string): ImageProvider {
  const auth = { Authorization: `Bearer ${apiKey}` };
  return {
    async generate({ prompt, size }) {
      const res = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { ...auth, 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt, size, n: 1 }),
      });
      if (!res.ok) throw new Error(`openai image ${res.status}`);
      return (await res.json()).data[0].b64_json as string;
    },
    async edit({ prompt, imageBase64, size }) {
      const form = new FormData();
      form.append('model', model);
      form.append('prompt', prompt);
      form.append('size', size);
      form.append('image', pngBlob(imageBase64), 'drawing.png');
      const res = await fetchWithTimeout('https://api.openai.com/v1/images/edits', { method: 'POST', headers: auth, body: form });
      if (!res.ok) throw new Error(`openai edit ${res.status}`);
      return (await res.json()).data[0].b64_json as string;
    },
  };
}

// Moderation client (true = safe).
export function openaiModerator(apiKey: string): Moderator {
  const call = async (input: unknown) => {
    const res = await fetchWithTimeout('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'omni-moderation-latest', input }),
    });
    if (!res.ok) throw new Error(`moderation ${res.status}`);
    const body = await res.json();
    return !(body.results ?? []).some((r: { flagged: boolean }) => r.flagged);
  };
  return {
    text: (input) => call(input),
    image: (b64) => call([{ type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } }]),
  };
}
