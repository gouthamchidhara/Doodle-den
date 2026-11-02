// Ramps & Rollers physics (A5) with planck: drawn strokes → static chains, balls drop from 3 spots, a bucket at the bottom.
import { Box, Chain, Circle, Vec2, World, type Body, type Contact } from 'planck';

export const PX_PER_M = 50;
export const STEP = 1 / 60;
export const VEL_ITERS = 8;
export const POS_ITERS = 3;
export const BALL_R_M = 0.4;
export const MAX_BALLS = 15;
export const KEEP_EVERY_PX = 12;
export const SKINS = ['ball', 'orange', 'cat'] as const;
export type Skin = (typeof SKINS)[number];

export interface BallView {
  id: number;
  x: number; // px
  y: number; // px
  angle: number; // rad
  skin: Skin;
}

// Keeps a point every 12 px (A5) — first and last always kept.
export function thinRamp(points: { x: number; y: number }[], every = KEEP_EVERY_PX): { x: number; y: number }[] {
  if (points.length < 2) return points;
  const out = [points[0]];
  for (const p of points.slice(1, -1)) {
    const last = out[out.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) >= every) out.push(p);
  }
  const end = points[points.length - 1];
  const last = out[out.length - 1];
  if (Math.hypot(end.x - last.x, end.y - last.y) > 1e-6) out.push(end);
  return out;
}

const m = (px: number) => px / PX_PER_M;

export class RampsWorld {
  readonly world = new World({ gravity: Vec2(0, 10) });
  private balls: { id: number; body: Body; skin: Skin }[] = [];
  private nextId = 1;
  private skinIndex = 0;
  private acc = 0;
  private landed: number[] = [];
  private everLanded = new Set<number>();
  readonly bucket: { x: number; y: number; w: number; h: number };

  // bucketX = 0..1 of the width (random per session).
  constructor(
    readonly width: number,
    readonly height: number,
    bucketX: number,
  ) {
    const w = 140;
    const h = 90;
    this.bucket = { x: Math.max(w / 2, Math.min(width - w / 2, bucketX * width)), y: height - h, w, h };
    const b = this.world.createBody();
    const { x, y } = this.bucket;
    b.createFixture(new Chain([Vec2(m(x - w / 2), m(y)), Vec2(m(x - w / 2), m(y + h)), Vec2(m(x + w / 2), m(y + h)), Vec2(m(x + w / 2), m(y))], false), { friction: 0.3 });
    b.createFixture(new Box(m(w / 2 - 6), m(h / 3), Vec2(m(x), m(y + (h * 2) / 3)), 0), { isSensor: true, userData: 'bucket' });
    this.world.on('begin-contact', (c: Contact) => this.onContact(c));
  }

  private onContact(c: Contact): void {
    const a = c.getFixtureA();
    const b = c.getFixtureB();
    const sensor = a.getUserData() === 'bucket' ? a : b.getUserData() === 'bucket' ? b : null;
    if (!sensor) return;
    const other = sensor === a ? b : a;
    const ball = this.balls.find((x) => x.body === other.getBody());
    if (ball && !this.everLanded.has(ball.id)) {
      this.everLanded.add(ball.id);
      this.landed.push(ball.id);
    }
  }

  // Adds one drawn stroke (px points) as a static chain.
  addRamp(points: { x: number; y: number }[]): void {
    const pts = thinRamp(points);
    if (pts.length < 2) return;
    this.world.createBody().createFixture(new Chain(pts.map((p) => Vec2(m(p.x), m(p.y))), false), { friction: 0.3 });
  }

  // Drops a ball at x (px) from the top; returns false when 15 are already rolling.
  dropBall(x: number): boolean {
    if (this.balls.length >= MAX_BALLS) return false;
    const body = this.world.createDynamicBody({ position: Vec2(m(x), m(BALL_R_M * PX_PER_M + 4)) });
    body.createFixture(new Circle(BALL_R_M), { density: 1, restitution: 0.4, friction: 0.3 });
    this.balls.push({ id: this.nextId++, body, skin: SKINS[this.skinIndex++ % SKINS.length] });
    return true;
  }

  // Advances by real elapsed seconds using fixed 1/60 s steps; returns ids that just landed in the bucket.
  advance(dt: number): number[] {
    this.acc += Math.min(dt, 0.25);
    while (this.acc >= STEP) {
      this.world.step(STEP, VEL_ITERS, POS_ITERS);
      this.acc -= STEP;
    }
    for (const b of [...this.balls]) {
      const p = b.body.getPosition();
      if (p.y * PX_PER_M > this.height + 100 || p.x * PX_PER_M < -100 || p.x * PX_PER_M > this.width + 100) this.remove(b.id);
    }
    const out = this.landed;
    this.landed = [];
    return out;
  }

  private remove(id: number): void {
    const b = this.balls.find((x) => x.id === id);
    if (!b) return;
    this.world.destroyBody(b.body);
    this.balls = this.balls.filter((x) => x.id !== id);
  }

  // Removes every ball ("Reset balls").
  reset(): void {
    for (const b of [...this.balls]) this.remove(b.id);
  }

  // Ball positions for rendering.
  view(): BallView[] {
    return this.balls.map((b) => {
      const p = b.body.getPosition();
      return { id: b.id, x: p.x * PX_PER_M, y: p.y * PX_PER_M, angle: b.body.getAngle(), skin: b.skin };
    });
  }
}
