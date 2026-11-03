// Jigsaw pieces (A5): grid cuts with classic tab/blank edges seeded by artwork id + piece count; 24 px snap. Pure.
import { seededRandom } from '@/canvas/strokeModel';

export const PIECE_COUNTS = [4, 9, 16, 24] as const;
export type PieceCount = (typeof PIECE_COUNTS)[number];
export const SNAP_PX = 24;

// Rows × cols for a count (24 = 4 × 6, laid out along the long side).
export function gridFor(count: PieceCount, landscape: boolean): { rows: number; cols: number } {
  if (count === 24) return landscape ? { rows: 4, cols: 6 } : { rows: 6, cols: 4 };
  const n = Math.round(Math.sqrt(count));
  return { rows: n, cols: n };
}

export interface Edges {
  right: number[][]; // [row][col]: cut between col and col+1; +1 = tab out to the right, -1 = blank
  bottom: number[][]; // [row][col]: cut between row and row+1; +1 = tab out downward
}

// Seeded tab directions for every internal edge.
export function makeEdges(seed: string, rows: number, cols: number): Edges {
  const r = seededRandom(seed);
  const right = Array.from({ length: rows }, () => Array.from({ length: cols - 1 }, () => (r() < 0.5 ? 1 : -1)));
  const bottom = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, () => (r() < 0.5 ? 1 : -1)));
  return { right, bottom };
}

// The four sides of piece (row, col): +1 bumps out, -1 goes in, 0 flat. Neighbours always fit.
export function pieceSides(e: Edges, row: number, col: number, rows: number, cols: number): { top: number; right: number; bottom: number; left: number } {
  return {
    top: row === 0 ? 0 : -e.bottom[row - 1][col],
    right: col === cols - 1 ? 0 : e.right[row][col],
    bottom: row === rows - 1 ? 0 : e.bottom[row][col],
    left: col === 0 ? 0 : -e.right[row][col - 1],
  };
}

// One side from (x0,y0) to (x1,y1) with an optional tab; (nx, ny) is the outward normal.
function side(x0: number, y0: number, x1: number, y1: number, nx: number, ny: number, sign: number, size: number): string {
  if (sign === 0) return `L${x1} ${y1}`;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const p = (t: number, out: number) => `${x0 + dx * t + nx * out * sign * size} ${y0 + dy * t + ny * out * sign * size}`;
  return `L${p(0.36, 0)}C${p(0.4, 0.05)} ${p(0.3, 0.9)} ${p(0.5, 0.9)}C${p(0.7, 0.9)} ${p(0.6, 0.05)} ${p(0.64, 0)}L${x1} ${y1}`;
}

// SVG path of a piece in its own box: the cell sits at (pad, pad) and tabs reach into the padding.
export function piecePath(w: number, h: number, pad: number, sides: { top: number; right: number; bottom: number; left: number }): string {
  const tab = Math.min(w, h) * 0.25;
  const x0 = pad;
  const y0 = pad;
  const x1 = pad + w;
  const y1 = pad + h;
  return `M${x0} ${y0}${side(x0, y0, x1, y0, 0, -1, sides.top, tab)}${side(x1, y0, x1, y1, 1, 0, sides.right, tab)}${side(x1, y1, x0, y1, 0, 1, sides.bottom, tab)}${side(x0, y1, x0, y0, -1, 0, sides.left, tab)}Z`;
}

// True when a dropped piece is within 24 px of its home spot.
export function shouldSnap(x: number, y: number, homeX: number, homeY: number, snap = SNAP_PX): boolean {
  return Math.hypot(x - homeX, y - homeY) <= snap;
}

// Starting tray positions (seeded) inside a rectangle.
export function scatter(seed: string, count: number, area: { x: number; y: number; w: number; h: number }, pw: number, ph: number): { x: number; y: number }[] {
  const r = seededRandom(`${seed}-scatter`);
  return Array.from({ length: count }, () => ({ x: area.x + r() * Math.max(0, area.w - pw), y: area.y + r() * Math.max(0, area.h - ph) }));
}
