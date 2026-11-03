// Feature logic (A7), separate from Deno.serve so it can be unit-tested with fake providers.
import { AiError } from './contract.ts';
import { checkImage, checkText } from './moderation.ts';
import type { ImageProvider, Moderator, TextProvider } from './providers/types.ts';
import tiles from './aiIdeaTiles.json' with { type: 'json' };
import coachIdeas from './coachIdeas.json' with { type: 'json' };

export interface Ai {
  text: TextProvider;
  image: ImageProvider;
  mod: Moderator;
}

// ---------- Feature 1 · Coloring Page Maker ----------
export const REWRITE_SYSTEM =
  "Rewrite the child's idea as a short, safe, kid-friendly coloring page subject, max 8 words. No brands, no real people, no scary or violent content. If it cannot be made appropriate for a 3-8 year old, return exactly BLOCKED. Return only the subject.";

// The exact coloring image prompt.
export function coloringPrompt(idea: string, ageMode: 'little' | 'big'): string {
  const p = `A children's coloring book page of ${idea}. Simple black outlines only on a pure white background, thick clean lines, large closed shapes that are easy to color, no shading, no gray, no text, no letters, cute and friendly, centered, whole subject visible.`;
  return ageMode === 'little' ? `${p} Very simple, few large shapes.` : p;
}

// Tiles must match the lists exactly.
export function ideaFromTiles(t: { who: string; doing?: string; where?: string }): string {
  if (!tiles.who.includes(t.who)) throw new AiError('BAD_INPUT');
  if (t.doing && !tiles.doing.includes(t.doing)) throw new AiError('BAD_INPUT');
  if (t.where && !tiles.where.includes(t.where)) throw new AiError('BAD_INPUT');
  return [t.who, t.doing ?? '', t.where ?? ''].join(' ').replace(/\s+/g, ' ').trim();
}

// Coloring page: idea → image → moderation.
export async function coloringPage(ai: Ai, b: { ageMode: 'little' | 'big'; tiles?: { who: string; doing?: string; where?: string }; spokenText?: string }) {
  let idea: string;
  if (b.tiles) idea = ideaFromTiles(b.tiles);
  else {
    if (b.ageMode !== 'big' || !b.spokenText) throw new AiError('BAD_INPUT');
    await checkText(ai.mod, b.spokenText);
    idea = (await ai.text.complete({ system: REWRITE_SYSTEM, user: b.spokenText, maxTokens: 40, json: false })).trim();
    if (!idea || idea === 'BLOCKED') throw new AiError('BLOCKED');
    await checkText(ai.mod, idea);
  }
  const imageBase64 = await ai.image.generate({ prompt: coloringPrompt(idea, b.ageMode), size: '1024x1024' });
  await checkImage(ai.mod, imageBase64);
  return { imageBase64, idea };
}

// ---------- Feature 2 · Magic Sketch ----------
export const SKETCH_PROMPT =
  "Redraw this child's drawing as a clean, colorful cartoon illustration for young children. Keep the same subject, pose, layout and the colors the child chose. Bold outlines, flat bright colors, friendly, no text, no realistic human faces, white background.";

// Magic Sketch: moderate in → edit → moderate out.
export async function magicSketch(ai: Ai, b: { imageBase64: string }) {
  await checkImage(ai.mod, b.imageBase64);
  const imageBase64 = await ai.image.edit({ prompt: SKETCH_PROMPT, imageBase64: b.imageBase64, size: '1024x1024' });
  await checkImage(ai.mod, imageBase64);
  return { imageBase64 };
}

// ---------- JSON helper with one retry ----------
// Calls the model and parses JSON; retries once on invalid JSON, then BAD_INPUT→PROVIDER_ERROR.
export async function completeJson<T>(text: TextProvider, opts: Parameters<TextProvider['complete']>[0], check: (v: unknown) => v is T): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await text.complete({ ...opts, json: true });
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      const v: unknown = JSON.parse(m ? m[0] : raw);
      if (check(v)) return v;
    } catch {
      // retry
    }
  }
  throw new AiError('PROVIDER_ERROR');
}

// ---------- Feature 3 · Story Maker ----------
export const CAPTION_SYSTEM = 'Describe each child\'s drawing in max 12 simple words, as what it most likely shows. Be kind. Return JSON {"captions": [string, ...]} in the same order.';

// The exact story system prompt for an age band.
export function storySystem(ageMode: 'little' | 'big'): string {
  const little = ageMode === 'little';
  return `You write very short, gentle, happy stories for children aged ${little ? '3-5' : '6-8'}.
Rules: max ${little ? 60 : 120} words total. ${little ? '4-6' : '6-10'} short sentences. Simple everyday words.
Happy ending. No violence, no scary content, no danger, no brands, no real people,
no romance, no unsafe activities, no questions to the reader.
Each drawing appears in order as a character, object or place.
Return only JSON: {"title": string (max 6 words), "pages": [{"artIndex": number, "text": string}]}
with exactly one page per drawing.`;
}

export interface Story {
  title: string;
  pages: { artIndex: number; text: string }[];
}

// Word count of a story's pages.
export function storyWords(s: Story): number {
  return s.pages.reduce((n, p) => n + p.text.split(/\s+/).filter(Boolean).length, 0);
}

// Story: captions (vision) → story (text) → limits + moderation.
export async function makeStory(ai: Ai, b: { ageMode: 'little' | 'big'; images: string[]; heroName?: string }): Promise<Story> {
  const caps = await completeJson(ai.text, { system: CAPTION_SYSTEM, user: `There are ${b.images.length} drawings.`, images: b.images, maxTokens: 300, json: true }, (v): v is { captions: string[] } =>
    !!v && Array.isArray((v as { captions?: unknown }).captions),
  );
  const n = b.images.length;
  const list = caps.captions.slice(0, n).map((c, i) => `${i + 1}. ${c}`).join('\n');
  const story = await completeJson(
    ai.text,
    { system: storySystem(b.ageMode), user: `Drawings in order: ${list}. Hero: ${b.heroName ?? 'our little artist'}.`, maxTokens: 600, json: true },
    (v): v is Story => {
      const s = v as Story;
      return !!s && typeof s.title === 'string' && Array.isArray(s.pages) && s.pages.length === n && s.pages.every((p) => typeof p.text === 'string' && typeof p.artIndex === 'number');
    },
  );
  if (storyWords(story) > (b.ageMode === 'little' ? 60 : 120) || story.title.split(/\s+/).length > 6) throw new AiError('PROVIDER_ERROR');
  await checkText(ai.mod, story.title, ...story.pages.map((p) => p.text));
  return story;
}

// ---------- Feature 4 · Mascot Guesses ----------
export const GUESS_SYSTEM = 'A young child drew this. Make 3 short, funny, kind guesses of what it might be. Each 1-3 words, things a 5-year-old knows. Never say anything negative about the drawing. Return only JSON {"guesses": [string, string, string]}.';

// Guesses: blocked guesses dropped; none left → 'a happy surprise'.
export async function guess(ai: Ai, b: { imageBase64: string }) {
  const r = await completeJson(ai.text, { system: GUESS_SYSTEM, user: 'What could it be?', images: [b.imageBase64], maxTokens: 100, json: true }, (v): v is { guesses: string[] } =>
    !!v && Array.isArray((v as { guesses?: unknown }).guesses),
  );
  const safe: string[] = [];
  for (const g of r.guesses.slice(0, 3)) {
    try {
      await checkText(ai.mod, g);
      safe.push(g);
    } catch {
      // dropped
    }
  }
  return { guesses: safe.length > 0 ? safe : ['a happy surprise'] };
}

// ---------- Feature 5 · Drawing Coach ----------
export const COACH_IDS: string[] = coachIdeas.map((c) => c.id);

// The coach system prompt with the fixed list.
export function coachSystem(): string {
  return `Look at this child's drawing. Choose the ONE idea id from the list that would be the most fun next step. Return only JSON {"id": "<id>"}.\n${coachIdeas.map((c) => `${c.id}: ${c.text}`).join('\n')}`;
}

// Coach: the answer is always an id from the list (unknown → add_sun).
export async function coach(ai: Ai, b: { imageBase64: string }) {
  const raw = await ai.text.complete({ system: coachSystem(), user: 'Pick one idea.', images: [b.imageBase64], maxTokens: 30, json: true });
  let id = 'add_sun';
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    const v = JSON.parse(m ? m[0] : raw) as { id?: unknown };
    if (typeof v.id === 'string' && COACH_IDS.includes(v.id)) id = v.id;
  } catch {
    // keep add_sun
  }
  return { id };
}

// ---------- Feature 6 · Parent AI Digest ----------
export const DIGEST_SYSTEM =
  "Write a warm, 3-4 sentence weekly note to a parent about their child's creative play. Use only the facts given. Mention one highlight and one gentle idea for real-world play. Do not give medical, developmental or diagnostic opinions. Do not lecture about screen time. Plain words.";

// Digest from numbers only.
export async function digest(ai: Ai, b: { week: Record<string, unknown> }) {
  const text = (await ai.text.complete({ system: DIGEST_SYSTEM, user: JSON.stringify(b.week), maxTokens: 250, json: false })).trim();
  await checkText(ai.mod, text);
  return { text };
}
