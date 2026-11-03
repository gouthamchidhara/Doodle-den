// Deno tests: blocklist whole words, coach ids, story JSON retry, coloring tiles.
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { passesBlocklist } from './blocklist.ts';
import { coach, coloringPage, guess, ideaFromTiles, makeStory, type Ai } from './features.ts';

const okMod = { text: async () => true, image: async () => true };
const ai = (answers: string[]): Ai => ({
  text: { complete: async () => answers.shift() ?? '' },
  image: { generate: async () => 'png', edit: async () => 'png' },
  mod: okMod,
});

Deno.test('blocklist matches whole words only', () => {
  assertEquals(passesBlocklist('a happy cat'), true);
  assertEquals(passesBlocklist('a dead fish'), false);
  assertEquals(passesBlocklist('Bloodhound'), true);
  assertEquals(passesBlocklist('call 1234567'), false);
  assertEquals(passesBlocklist('me@x'), false);
});

Deno.test('coach never returns an id outside the list', async () => {
  assertEquals((await coach(ai(['{"id":"hack_the_planet"}']), { imageBase64: 'x' })).id, 'add_sun');
  assertEquals((await coach(ai(['junk']), { imageBase64: 'x' })).id, 'add_sun');
  assertEquals((await coach(ai(['{"id":"add_rainbow"}']), { imageBase64: 'x' })).id, 'add_rainbow');
});

Deno.test('story retries invalid JSON once', async () => {
  const story = await makeStory(ai(['{"captions":["a cat"]}', 'not json', '{"title":"The Cat","pages":[{"artIndex":0,"text":"A cat smiled."}]}']), { ageMode: 'little', images: ['x'] });
  assertEquals(story.title, 'The Cat');
  await assertRejects(() => makeStory(ai(['{"captions":["a cat"]}', 'bad', 'bad']), { ageMode: 'little', images: ['x'] }));
});

Deno.test('coloring tiles must match the list; guesses fall back', async () => {
  assertEquals(ideaFromTiles({ who: 'cat', doing: 'flying', where: 'in space' }), 'cat flying in space');
  await assertRejects(() => coloringPage(ai([]), { ageMode: 'big', tiles: { who: 'spaceship of doom' } }));
  const g = await guess({ ...ai(['{"guesses":["blood","gun","knife"]}']) }, { imageBase64: 'x' });
  assertEquals(g.guesses, ['a happy surprise']);
});
