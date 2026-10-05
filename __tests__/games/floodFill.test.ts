// T-040: flood fill on a small test image — never leaks through closed lines, snaps off lines.
import { buildWallMask, emptyLayer, findOpenPixel, floodRegion, tapFill } from '@/games/coloring/floodFill';

// 12x12 white image with a closed 1-px black box from (2,2) to (8,8).
function boxImage(gapAt?: [number, number]): { rgba: Uint8Array; w: number; h: number } {
  const w = 12;
  const h = 12;
  const rgba = new Uint8Array(w * h * 4).fill(255);
  for (let y = 2; y <= 8; y += 1) {
    for (let x = 2; x <= 8; x += 1) {
      if (x !== 2 && x !== 8 && y !== 2 && y !== 8) continue;
      if (gapAt && gapAt[0] === x && gapAt[1] === y) continue;
      const o = (y * w + x) * 4;
      rgba[o] = 0;
      rgba[o + 1] = 0;
      rgba[o + 2] = 0;
    }
  }
  return { rgba, w, h };
}

const count = (a: Uint8Array) => a.reduce((s, v) => s + v, 0);

describe('flood fill', () => {
  it('builds a wall mask from luminance', () => {
    const { rgba, w, h } = boxImage();
    const mask = buildWallMask(rgba, w, h);
    expect(mask[2 * w + 2]).toBe(1);
    expect(mask[5 * w + 5]).toBe(0);
    expect(count(mask)).toBe(24);
  });

  it('fills only the inside of a closed box', () => {
    const { rgba, w, h } = boxImage();
    const mask = buildWallMask(rgba, w, h);
    const region = floodRegion(mask, w, h, 5, 5);
    expect(region && count(region)).toBe(25);
    expect(region?.[0]).toBe(0);
  });

  it('fills the outside without entering the box', () => {
    const { rgba, w, h } = boxImage();
    const mask = buildWallMask(rgba, w, h);
    const region = floodRegion(mask, w, h, 0, 0);
    expect(region && count(region)).toBe(144 - 24 - 25);
    expect(region?.[5 * w + 5]).toBe(0);
  });

  it('a gap in the line lets the fill through (proves the walls are what stop it)', () => {
    const { rgba, w, h } = boxImage([8, 5]);
    const mask = buildWallMask(rgba, w, h);
    const region = floodRegion(mask, w, h, 5, 5);
    expect(region?.[0]).toBe(1);
  });

  it('a tap on a line snaps to the nearest open pixel and paints with bleed', () => {
    const { rgba, w, h } = boxImage();
    const mask = buildWallMask(rgba, w, h);
    expect(floodRegion(mask, w, h, 2, 5)).toBeNull();
    expect(findOpenPixel(mask, w, h, 2, 5)).not.toBeNull();
    const layer = emptyLayer(w, h);
    const painted = tapFill(layer, mask, w, h, 5, 5, [10, 20, 30]);
    expect(painted).toBeGreaterThan(25);
    expect(Array.from(layer.slice((5 * w + 5) * 4, (5 * w + 5) * 4 + 4))).toEqual([10, 20, 30, 255]);
    expect(layer[3]).toBe(0);
  });

  it('fills a 1024 px page quickly', () => {
    const w = 1024;
    const mask = new Uint8Array(w * w);
    for (let i = 0; i < w; i += 1) mask[512 * w + i] = 1;
    const layer = emptyLayer(w, w);
    const t0 = performance.now();
    tapFill(layer, mask, w, w, 10, 10, [1, 2, 3]);
    expect(performance.now() - t0).toBeLessThan(1500);
    expect(layer[(600 * w + 10) * 4 + 3]).toBe(0);
  });
});
