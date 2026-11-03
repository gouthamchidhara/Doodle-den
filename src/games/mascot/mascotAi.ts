// Mascot Guess / Idea rules (A7 Features 4–5): Guess needs 5+ strokes, once per 30 s; Idea once per 60 s; Magic at 10+ strokes.
import coachIdeas from '@/content/coachIdeas.json';

export const GUESS_MIN_STROKES = 5;
export const MAGIC_MIN_STROKES = 10;
export const GUESS_GAP_MS = 30_000;
export const IDEA_GAP_MS = 60_000;

// True when `gap` ms have passed since `last` (null = never).
export function ready(last: number | null, now: number, gap: number): boolean {
  return last === null || now - last >= gap;
}

// The spoken guess line: "Is it… a giraffe? A banana? A rocket?"
export function guessLine(guesses: string[]): string {
  const withA = guesses.map((g) => (/^(a|an|the)\s/i.test(g) ? g : `${/^[aeiou]/i.test(g) ? 'an' : 'a'} ${g}`));
  const [first, ...rest] = withA;
  return `Is it… ${first}?${rest.map((r) => ` ${r.charAt(0).toUpperCase()}${r.slice(1)}?`).join('')}`;
}

// Local text + voice for a coach id (unknown → add_sun).
export function coachIdea(id: string): { text: string; voice: string } {
  const c = coachIdeas.find((x) => x.id === id) ?? coachIdeas.find((x) => x.id === 'add_sun') ?? coachIdeas[0];
  return { text: c.text, voice: c.voice };
}

// A random local idea (offline / Magic off).
export function randomIdea(rand: () => number = Math.random): { text: string; voice: string } {
  const c = coachIdeas[Math.floor(rand() * coachIdeas.length)];
  return { text: c.text, voice: c.voice };
}
