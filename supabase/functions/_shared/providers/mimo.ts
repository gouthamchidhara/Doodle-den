// Xiaomi MiMo text + vision adapter (AI_TEXT_PROVIDER=mimo).
// OpenAI-compatible chat completions against the dedicated endpoint, e.g.
// https://token-plan-sgp.xiaomimimo.com/v1/chat/completions. Model ids come from
// GET <base>/v1/models with the API key; set AI_TEXT_MODEL to one of them.
import { fetchWithTimeout } from './timeout.ts';
import type { TextProvider } from './types.ts';

// Chat Completions client (text + vision via image_url content parts).
export function mimoText(apiKey: string, model: string, baseUrl: string): TextProvider {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  return {
    async complete({ system, user, images = [], maxTokens, json }) {
      const content = [
        ...images.map((data) => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${data}` } })),
        { type: 'text', text: json ? `${user}\n\nReply with JSON only.` : user },
      ];
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: [
          { role: 'system', content: system },
          { role: 'user', content },
        ] }),
      });
      if (!res.ok) throw new Error(`mimo ${res.status}`);
      const body = await res.json();
      return (body.choices?.[0]?.message?.content ?? '').trim();
    },
  };
}
