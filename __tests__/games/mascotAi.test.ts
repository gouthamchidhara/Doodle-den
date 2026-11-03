// T-079: rate limits, guess line, coach ids resolve to local text/voice.
import { coachIdea, GUESS_GAP_MS, guessLine, IDEA_GAP_MS, ready } from '@/games/mascot/mascotAi';

describe('mascot AI helpers', () => {
  it('rate limits 30 s / 60 s', () => {
    expect(ready(null, 0, GUESS_GAP_MS)).toBe(true);
    expect(ready(1000, 20_000, GUESS_GAP_MS)).toBe(false);
    expect(ready(1000, 31_000, GUESS_GAP_MS)).toBe(true);
    expect(ready(0, 59_999, IDEA_GAP_MS)).toBe(false);
  });

  it('speaks the guesses kindly', () => {
    expect(guessLine(['giraffe', 'banana', 'rocket'])).toBe('Is it… a giraffe? A banana? A rocket?');
    expect(guessLine(['owl'])).toBe('Is it… an owl?');
  });

  it('coach ids map to local lines; unknown → add_sun', () => {
    expect(coachIdea('add_rainbow')).toEqual({ text: 'Add a rainbow!', voice: 'coach_add_rainbow' });
    expect(coachIdea('nope').text).toBe('Add a big sun!');
  });
});
