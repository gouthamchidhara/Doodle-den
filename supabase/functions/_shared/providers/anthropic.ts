// Anthropic text + vision adapter (default AI_TEXT_PROVIDER).
import { fetchWithTimeout } from './timeout.ts';
import type { TextProvider } from './types.ts';

// Messages API client.
export function anthropicText(apiKey: string, model: string): TextProvider {
  return {
    async complete({ system, user, images = [], maxTokens, json }) {
      const content = [
        ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/png', data } })),
        { type: 'text', text: json ? `${user}\n\nReply with JSON only.` : user },
      ];
      const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}`);
      const body = await res.json();
      return (body.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('').trim();
    },
  };
}
