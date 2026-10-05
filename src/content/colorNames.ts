// Picture-word chips for naming a new color (A5 Name Your Colors).
export const FIRST_WORDS = ['dragon', 'unicorn', 'sunny', 'ocean', 'monster', 'rainbow', 'bubble', 'cookie', 'jelly', 'rocket', 'banana', 'frog'] as const;
export const SECOND_WORDS = ['green', 'splash', 'swirl', 'sparkle', 'goo', 'cloud', 'juice', 'dust'] as const;
export const MAX_SPOKEN_NAME = 20;

// "dragon" + "goo" → "Dragon Goo".
export function colorName(first: string, second: string): string {
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  return `${cap(first)} ${cap(second)}`;
}
