// Client copy of the kid-text blocklist (A7 Blocklist): whole words, case-insensitive, plus personal-info patterns.
// The server keeps the master copy in supabase/functions/_shared/blocklist.ts; the owner reviews both.
export const BLOCKED_WORDS: readonly string[] = [
  'kill', 'killer', 'dead', 'death', 'die', 'blood', 'bloody', 'gun', 'guns', 'knife', 'sword', 'bomb', 'shoot', 'war', 'murder', 'stab',
  'zombie', 'demon', 'devil', 'ghost', 'skeleton', 'skull', 'horror', 'scary', 'creepy', 'nightmare',
  'sex', 'sexy', 'naked', 'nude', 'boob', 'boobs', 'butt', 'kiss',
  'drug', 'drugs', 'weed', 'beer', 'wine', 'vodka', 'drunk', 'smoke', 'cigarette', 'vape',
  'stupid', 'dumb', 'idiot', 'hate', 'ugly', 'fat', 'shut', 'poop', 'pee',
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'dick', 'piss',
  'suicide', 'cut', 'hurt',
  'disney', 'pokemon', 'pikachu', 'mario', 'elsa', 'barbie', 'lego', 'marvel', 'batman', 'spiderman', 'minecraft', 'roblox', 'fortnite', 'nike', 'youtube', 'tiktok',
  'street', 'road', 'avenue', 'lane', 'drive', 'address', 'phone', 'email',
];

const WORDS = new Set(BLOCKED_WORDS);

// True when the text is safe for a kid feature (no blocked word, no 5+ digit run, no @, no http).
export function isTextAllowed(text: string): boolean {
  const t = text.toLowerCase();
  if (/\d{5,}/.test(t) || t.includes('@') || t.includes('http')) return false;
  return !t.split(/[^a-z]+/).some((w) => w && WORDS.has(w));
}
