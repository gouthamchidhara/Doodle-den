// Bitmap flood fill for coloring pages (A5 Coloring engine). Pure: works on RGBA byte arrays.
export const WORK_SIZE = 1024;
export const WALL_LUMA = 128;
export const SNAP_RADIUS = 6;

// Wall mask from RGBA line art: 1 where luminance < 128 (transparent pixels count as paper).
export function buildWallMask(rgba: Uint8Array, w: number, h: number): Uint8Array {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const o = i * 4;
    const a = rgba[o + 3] / 255;
    const luma = (0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2]) * a + 255 * (1 - a);
    mask[i] = luma < WALL_LUMA ? 1 : 0;
  }
  return mask;
}

// Nearest non-wall pixel within `radius` (tap on a line snaps into the nearest area); null if none.
export function findOpenPixel(mask: Uint8Array, w: number, h: number, x: number, y: number, radius = SNAP_RADIUS): { x: number; y: number } | null {
  const cx = Math.round(x);
  const cy = Math.round(y);
  let best: { x: number; y: number; d: number } | null = null;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || py < 0 || px >= w || py >= h || mask[py * w + px] === 1) continue;
      const d = dx * dx + dy * dy;
      if (d <= radius * radius && (!best || d < best.d)) best = { x: px, y: py, d };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

// Scanline flood fill over non-wall pixels from (x, y). Returns a region mask (1 = inside), or null on a wall.
export function floodRegion(mask: Uint8Array, w: number, h: number, x: number, y: number): Uint8Array | null {
  const sx = Math.round(x);
  const sy = Math.round(y);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h || mask[sy * w + sx] === 1) return null;
  const region = new Uint8Array(w * h);
  const stack: number[] = [sx, sy];
  const open = (px: number, py: number) => mask[py * w + px] === 0 && region[py * w + px] === 0;
  while (stack.length > 0) {
    const py = stack.pop() as number;
    let px = stack.pop() as number;
    if (!open(px, py)) continue;
    while (px > 0 && open(px - 1, py)) px -= 1;
    let upOpen = false;
    let downOpen = false;
    for (; px < w && open(px, py); px += 1) {
      region[py * w + px] = 1;
      if (py > 0) {
        const o = open(px, py - 1);
        if (o && !upOpen) stack.push(px, py - 1);
        upOpen = o;
      }
      if (py < h - 1) {
        const o = open(px, py + 1);
        if (o && !downOpen) stack.push(px, py + 1);
        downOpen = o;
      }
    }
  }
  return region;
}

// Paints a region into an RGBA fill layer, spreading `bleed` px under the lines so no white halo shows.
export function paintRegion(layer: Uint8Array, region: Uint8Array, mask: Uint8Array, w: number, h: number, rgb: [number, number, number], bleed = 2): number {
  let painted = 0;
  const set = (i: number) => {
    const o = i * 4;
    layer[o] = rgb[0];
    layer[o + 1] = rgb[1];
    layer[o + 2] = rgb[2];
    layer[o + 3] = 255;
    painted += 1;
  };
  for (let i = 0; i < w * h; i += 1) if (region[i] === 1) set(i);
  if (bleed <= 0) return painted;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      if (mask[i] !== 1 || region[i] === 1) continue;
      let near = false;
      for (let dy = -bleed; dy <= bleed && !near; dy += 1) {
        for (let dx = -bleed; dx <= bleed; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && region[ny * w + nx] === 1) {
            near = true;
            break;
          }
        }
      }
      if (near) set(i);
    }
  }
  return painted;
}

// Full tap-fill: snap off a line if needed, flood, paint. Returns painted pixel count (0 = nothing).
export function tapFill(layer: Uint8Array, mask: Uint8Array, w: number, h: number, x: number, y: number, rgb: [number, number, number]): number {
  const start = mask[Math.round(y) * w + Math.round(x)] === 1 ? findOpenPixel(mask, w, h, x, y) : { x, y };
  if (!start) return 0;
  const region = floodRegion(mask, w, h, start.x, start.y);
  return region ? paintRegion(layer, region, mask, w, h, rgb) : 0;
}

// Empty (fully transparent) fill layer.
export function emptyLayer(w: number, h: number): Uint8Array {
  return new Uint8Array(w * h * 4);
}
