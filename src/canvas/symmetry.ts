// Kaleidoscope symmetry math (A5): 2 = mirror left/right; 4/8 = rotations by 360/n around the center.
export type Symmetry = 1 | 2 | 4 | 8;

// Rotation angles (degrees) used for n-fold symmetry (empty for 1 and for the mirror case).
export function rotationAngles(n: Symmetry): number[] {
  return n === 1 || n === 2 ? [] : Array.from({ length: n }, (_, i) => (360 / n) * i);
}

// Every copy of a point under the symmetry (the original first).
export function symmetryPoints(x: number, y: number, n: Symmetry, width: number, height: number): [number, number][] {
  if (n === 1) return [[x, y]];
  if (n === 2) return [
    [x, y],
    [width - x, y],
  ];
  const cx = width / 2;
  const cy = height / 2;
  return rotationAngles(n).map((deg) => {
    const a = (deg * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  });
}
