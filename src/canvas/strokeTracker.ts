// Plain (non-React) state machine for one in-progress stroke; the pan gesture calls into it.
import type { BrushType, Stroke, StrokePoint } from '@/types/models';
import { newId } from '@/utils/ids';

import { DEFAULT_PRESSURE, normalizePoint, shouldKeepPoint } from './strokeModel';

export interface StrokeInputOpts {
  width: number;
  height: number;
  tool: BrushType;
  color: string;
  size: 'S' | 'M' | 'L';
  stampId?: string;
  enabled: boolean;
  onStrokeStart?: () => void;
  onStrokePoint?: (p: StrokePoint) => void;
  onStrokeEnd: (s: Stroke) => void;
}

export interface PanEvt {
  x: number;
  y: number;
  stylusData?: { pressure?: number } | null;
}

export class StrokeTracker {
  private opts: StrokeInputOpts;
  private current: { stroke: Stroke; start: number } | null = null;
  private frame: number | null = null;
  private readonly onLive: (s: Stroke | null) => void;

  constructor(opts: StrokeInputOpts, onLive: (s: Stroke | null) => void) {
    this.opts = opts;
    this.onLive = onLive;
  }

  // Latest props from the component.
  setOpts(o: StrokeInputOpts): void {
    this.opts = o;
  }

  private point(e: PanEvt, start: number): StrokePoint {
    const { width, height } = this.opts;
    return normalizePoint(e.x, e.y, width, height, e.stylusData?.pressure ?? DEFAULT_PRESSURE, Date.now() - start);
  }

  private schedule(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      const c = this.current;
      this.onLive(c ? { ...c.stroke, points: [...c.stroke.points] } : null);
    });
  }

  // Finger/stylus down: starts a stroke.
  begin(e: PanEvt): void {
    const { tool, color, size, stampId } = this.opts;
    const start = Date.now();
    const p = this.point(e, start);
    this.current = { start, stroke: { id: newId(), tool, color, size, ...(tool === 'stamp' ? { stampId } : {}), points: [p] } };
    this.opts.onStrokeStart?.();
    this.opts.onStrokePoint?.(p);
    this.schedule();
  }

  // Finger moved: adds a point unless it is within 2 px of the last.
  update(e: PanEvt): void {
    const c = this.current;
    if (!c) return;
    const p = this.point(e, c.start);
    const pts = c.stroke.points;
    if (!shouldKeepPoint(pts[pts.length - 1], p, this.opts.width, this.opts.height)) return;
    pts.push(p);
    this.opts.onStrokePoint?.(p);
    this.schedule();
  }

  // Finger up or cancelled: commits the stroke.
  end(): void {
    const c = this.current;
    this.current = null;
    this.dispose();
    this.onLive(null);
    if (c) this.opts.onStrokeEnd(c.stroke);
  }

  // Cancels any pending frame.
  dispose(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }
}
