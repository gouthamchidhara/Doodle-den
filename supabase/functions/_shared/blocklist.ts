// Master kid-text blocklist (A7): whole words, case-insensitive, plus personal-info patterns. Owner reviews the list.
// The app keeps a copy in src/content/blocklist.ts; keep both in step.
export const BLOCKED_WORDS: readonly string[] = [
  'kill', 'killer', 'killing', 'dead', 'death', 'die', 'dies', 'blood', 'bloody', 'gun', 'guns', 'knife', 'knives', 'sword', 'bomb', 'shoot', 'shooting', 'war', 'murder', 'stab', 'weapon', 'weapons',
  'zombie', 'demon', 'devil', 'ghost', 'skeleton', 'skull', 'horror', 'scary', 'creepy', 'nightmare', 'monster-truck-crash',
  'sex', 'sexy', 'naked', 'nude', 'boob', 'boobs', 'butt', 'kiss', 'kissing',
  'drug', 'drugs', 'weed', 'beer', 'wine', 'vodka', 'drunk', 'alcohol', 'smoke', 'smoking', 'cigarette', 'vape',
  'stupid', 'dumb', 'idiot', 'hate', 'ugly', 'fat', 'loser',
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'dick', 'piss',
  'suicide', 'hurt', 'cutting',
  'disney', 'pokemon', 'pikachu', 'mario', 'elsa', 'barbie', 'lego', 'marvel', 'batman', 'spiderman', 'minecraft', 'roblox', 'fortnite', 'nike', 'youtube', 'tiktok', 'mcdonalds',
  'street', 'road', 'avenue', 'lane', 'address', 'phone', 'email',
];

const WORDS = new Set(BLOCKED_WORDS);

// True when the text passes: no blocked whole word, no 5+ digit run, no '@', no 'http'.
export function passesBlocklist(text: string): boolean {
  const t = text.toLowerCase();
  if (/\d{5,}/.test(t) || t.includes('@') || t.includes('http')) return false;
  return !t.split(/[^a-z]+/).some((w) => w !== '' && WORDS.has(w));
}
