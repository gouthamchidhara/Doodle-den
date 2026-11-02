// Oval racetrack geometry (A5): a stadium shape (two straights + two half circles) sized to the scene.
export interface TrackGeom {
  cx: number;
  cy: number;
  half: number; // half the straight length
  r: number; // radius of the curves (track center line)
  laneW: number;
  length: number;
}

// Track center line for a scene; leaves room for the title and bottom button.
export function trackGeom(width: number, height: number): TrackGeom {
  'worklet';
  const r = Math.min(height * 0.28, width * 0.22);
  const half = Math.max(0, width * 0.36 - r);
  return { cx: width / 2, cy: height * 0.55, half, r, laneW: r * 0.16, length: 4 * half + 2 * Math.PI * r };
}

// Point + heading (degrees) at distance s along the track, shifted sideways by `offset` px (outward positive).
export function trackPoint(g: TrackGeom, s: number, offset: number): { x: number; y: number; angle: number } {
  'worklet';
  const L = g.length;
  let d = ((s % L) + L) % L;
  const top = 2 * g.half;
  const arc = Math.PI * g.r;
  // Start line: middle of the bottom straight, driving to the right (counter-clockwise on screen).
  if (d < g.half) return { x: g.cx + d, y: g.cy + g.r + offset, angle: 0 };
  d -= g.half;
  if (d < arc) {
    const a = Math.PI / 2 - d / g.r;
    const rr = g.r + offset;
    return { x: g.cx + g.half + Math.cos(a) * rr, y: g.cy + Math.sin(a) * rr, angle: (-(d / g.r) * 180) / Math.PI };
  }
  d -= arc;
  if (d < top) return { x: g.cx + g.half - d, y: g.cy - g.r - offset, angle: 180 };
  d -= top;
  if (d < arc) {
    const a = -Math.PI / 2 - d / g.r;
    const rr = g.r + offset;
    return { x: g.cx - g.half + Math.cos(a) * rr, y: g.cy + Math.sin(a) * rr, angle: 180 - ((d / g.r) * 180) / Math.PI };
  }
  d -= arc;
  return { x: g.cx - g.half + d, y: g.cy + g.r + offset, angle: 0 };
}
