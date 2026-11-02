// T-056: balls roll on drawn ramps, land in the bucket, leave the screen, cap at 15; fixed 1/60 s steps.
import { MAX_BALLS, RampsWorld, thinRamp } from '@/games/ramps/rampsWorld';

describe('ramps physics', () => {
  it('keeps a point every 12 px', () => {
    const pts = Array.from({ length: 101 }, (_, i) => ({ x: i, y: 0 }));
    const thin = thinRamp(pts);
    expect(thin[0]).toEqual({ x: 0, y: 0 });
    expect(thin[thin.length - 1]).toEqual({ x: 100, y: 0 });
    expect(thin.length).toBe(10);
  });

  it('a ball rolls along a drawn ramp', () => {
    const w = new RampsWorld(800, 600, 0.1);
    w.addRamp([
      { x: 50, y: 150 },
      { x: 400, y: 300 },
      { x: 640, y: 420 },
    ]);
    w.dropBall(100);
    let maxX = 0;
    for (let i = 0; i < 200; i += 1) {
      w.advance(1 / 60);
      maxX = Math.max(maxX, ...w.view().map((b) => b.x));
    }
    expect(maxX).toBeGreaterThan(500);
  });

  it('a ball dropped over the bucket lands in it once', () => {
    const w = new RampsWorld(800, 600, 0.5);
    w.dropBall(w.bucket.x);
    const landed: number[] = [];
    for (let i = 0; i < 300; i += 1) landed.push(...w.advance(1 / 60));
    expect(landed).toEqual([1]);
  });

  it('balls that leave the screen are removed and at most 15 roll at once', () => {
    const w = new RampsWorld(400, 300, 0.1);
    for (let i = 0; i < 20; i += 1) w.dropBall(380);
    expect(w.view()).toHaveLength(MAX_BALLS);
    for (let i = 0; i < 400; i += 1) w.advance(1 / 60);
    expect(w.view().length).toBeLessThan(MAX_BALLS);
    w.reset();
    expect(w.view()).toHaveLength(0);
  });
});
