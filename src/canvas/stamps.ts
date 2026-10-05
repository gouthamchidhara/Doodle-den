// The 20 stamps (A5) as vector shapes in a 100x100 box. Placeholder art; owner can swap in PNGs later (T-103).
import { colors } from '@/theme/tokens';

export interface StampShape {
  d: string;
  fill: string;
}

export interface StampDef {
  id: string;
  label: string;
  shapes: StampShape[];
}

const I = colors.ink;
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`;

export const STAMPS: StampDef[] = [
  { id: 'heart', label: 'Heart', shapes: [{ d: 'M50 88S10 64 10 36a20 20 0 0 1 40-8 20 20 0 0 1 40 8c0 28-40 52-40 52z', fill: colors.tomato }] },
  { id: 'star', label: 'Star', shapes: [{ d: 'M50 6l13 28 30 4-22 21 6 30-27-15-27 15 6-30L7 38l30-4z', fill: colors.sun }] },
  { id: 'flower', label: 'Flower', shapes: [{ d: `${circle(50, 22, 16)}${circle(78, 46, 16)}${circle(66, 78, 16)}${circle(34, 78, 16)}${circle(22, 46, 16)}`, fill: colors.pink }, { d: circle(50, 52, 14), fill: colors.sun }] },
  { id: 'paw', label: 'Paw', shapes: [{ d: `${circle(50, 64, 22)}${circle(22, 38, 10)}${circle(40, 22, 10)}${circle(60, 22, 10)}${circle(78, 38, 10)}`, fill: colors.brown }] },
  { id: 'smile', label: 'Smile', shapes: [{ d: circle(50, 50, 42), fill: colors.sun }, { d: `${circle(36, 40, 6)}${circle(64, 40, 6)}M30 60c10 14 30 14 40 0l-4-2c-8 10-24 10-32 0z`, fill: I }] },
  { id: 'sun', label: 'Sun', shapes: [{ d: 'M50 2l8 18 18-8-6 19 19 6-18 8 8 18-19-5-10 17-10-17-19 5 8-18-18-8 19-6-6-19 18 8z', fill: colors.orange }, { d: circle(50, 50, 24), fill: colors.sun }] },
  { id: 'cloud', label: 'Cloud', shapes: [{ d: 'M24 78a18 18 0 0 1-2-36 24 24 0 0 1 46-6 18 18 0 0 1 10 42z', fill: colors.tint.sky.fill }] },
  { id: 'car', label: 'Car', shapes: [{ d: 'M8 66V50l14-16h40l18 16h12v16z', fill: colors.tomato }, { d: `${circle(28, 70, 11)}${circle(76, 70, 11)}`, fill: I }] },
  { id: 'fish', label: 'Fish', shapes: [{ d: 'M8 50c14-24 50-28 70 0-20 28-56 24-70 0zM78 50l18-16v32z', fill: colors.sky }, { d: circle(28, 46, 5), fill: I }] },
  { id: 'butterfly', label: 'Butterfly', shapes: [{ d: 'M50 50C30 10 4 20 12 44c4 10 20 12 38 6-18 6-30 22-20 34 12 12 24-8 20-34 0 26 8 46 20 34 10-12-2-28-20-34 18 6 34 4 38-6 8-24-18-34-38 6z', fill: colors.grape }] },
  { id: 'leaf', label: 'Leaf', shapes: [{ d: 'M14 86C10 40 40 10 90 10 90 60 60 90 14 86z', fill: colors.leaf }] },
  { id: 'note', label: 'Music note', shapes: [{ d: `M38 76V18l46-8v54h-8V20l-30 6v50z${circle(28, 76, 12)}${circle(72, 66, 12)}`, fill: I }] },
  { id: 'rainbow', label: 'Rainbow', shapes: [{ d: 'M6 80a44 44 0 0 1 88 0h-10a34 34 0 0 0-68 0z', fill: colors.tomato }, { d: 'M16 80a34 34 0 0 1 68 0H74a24 24 0 0 0-48 0z', fill: colors.sun }, { d: 'M26 80a24 24 0 0 1 48 0H64a14 14 0 0 0-28 0z', fill: colors.sky }] },
  { id: 'moon', label: 'Moon', shapes: [{ d: 'M60 8a42 42 0 1 0 32 66A34 34 0 1 1 60 8z', fill: colors.moon }] },
  { id: 'crown', label: 'Crown', shapes: [{ d: 'M10 76L4 26l26 22L50 14l20 34 26-22-6 50z', fill: colors.sun }] },
  { id: 'balloon', label: 'Balloon', shapes: [{ d: 'M50 6c20 0 32 16 32 34 0 22-18 36-32 40-14-4-32-18-32-40C18 22 30 6 50 6zM46 80h8l-2 6h-4z', fill: colors.pink }, { d: 'M49 86h2v12h-2z', fill: I }] },
  { id: 'apple', label: 'Apple', shapes: [{ d: 'M50 30c-26-14-44 8-38 34 6 24 22 32 38 24 16 8 32 0 38-24 6-26-12-48-38-34z', fill: colors.tomato }, { d: 'M48 30c0-10 4-18 12-22l2 4c-6 4-8 10-8 18z', fill: colors.leaf }] },
  { id: 'dino', label: 'Dino', shapes: [{ d: 'M8 80c4-20 20-30 40-30V26c0-12 10-20 22-20s20 8 20 18-8 14-18 14v28l10 26H68l-6-16H40l-6 16H22l2-10c-6 0-12 0-16-2z', fill: colors.leaf }] },
  { id: 'rocket', label: 'Rocket', shapes: [{ d: 'M50 4c18 14 24 34 22 58H28C26 38 32 18 50 4zM28 62L14 82l18-6zM72 62l14 20-18-6z', fill: colors.white }, { d: `${circle(50, 36, 9)}M40 66h20l-10 26z`, fill: colors.sky }] },
  { id: 'dot', label: 'Dot', shapes: [{ d: circle(50, 50, 40), fill: colors.grape }] },
];

export const STAMP_OUTLINE = I;

// 10 bonus stamps unlocked by rewards (A5 Sticker Book & rewards).
export const BONUS_STAMPS: StampDef[] = [
  { id: 'diamond', label: 'Diamond', shapes: [{ d: 'M30 10h40l20 24-40 56L10 34z', fill: colors.sky }, { d: 'M10 34h80L50 90z', fill: colors.tint.sky.fill }] },
  { id: 'planet', label: 'Planet', shapes: [{ d: circle(50, 50, 28), fill: colors.grape }, { d: 'M6 62c10-14 78-36 88-24 6 8-74 40-88 24zm10-4c6 4 60-14 70-22-12 0-64 16-70 22z', fill: colors.sun }] },
  { id: 'gift', label: 'Gift', shapes: [{ d: 'M14 40h72v50H14z', fill: colors.tomato }, { d: 'M44 40h12v50H44zM10 30h80v14H10z', fill: colors.sun }] },
  { id: 'bubble_stamp', label: 'Bubbles', shapes: [{ d: `${circle(38, 56, 26)}${circle(74, 30, 14)}${circle(72, 74, 9)}`, fill: colors.tint.sky.fill }] },
  { id: 'pencil', label: 'Pencil', shapes: [{ d: 'M20 70L66 24l14 14-46 46H20z', fill: colors.sun }, { d: 'M20 70v14h14z', fill: colors.ink }] },
  { id: 'abacus', label: 'Counting beads', shapes: [{ d: 'M12 12h76v76H12z', fill: colors.brown }, { d: `${circle(32, 32, 8)}${circle(52, 32, 8)}${circle(42, 52, 8)}${circle(62, 52, 8)}${circle(36, 72, 8)}${circle(66, 72, 8)}`, fill: colors.tomato }] },
  { id: 'kite', label: 'Kite', shapes: [{ d: 'M50 6l30 34-30 44-30-44z', fill: colors.pink }, { d: 'M48 84h4v12h-4z', fill: I }] },
  { id: 'palette', label: 'Paint palette', shapes: [{ d: 'M50 10c30 0 44 20 40 38-4 16-22 8-26 18-4 12 6 24-14 24-26 0-42-18-42-40S24 10 50 10z', fill: colors.white }, { d: `${circle(32, 34, 7)}${circle(54, 26, 7)}${circle(72, 38, 7)}`, fill: colors.tomato }, { d: circle(28, 58, 7), fill: colors.sky }] },
  { id: 'lightning', label: 'Lightning', shapes: [{ d: 'M58 4L18 56h26L36 96l46-56H54z', fill: colors.sun }] },
  { id: 'snowflake', label: 'Snowflake', shapes: [{ d: 'M46 6h8v88h-8zM10 46h80v8H10zM20 26l6-6 54 54-6 6zM74 20l6 6-54 54-6-6z', fill: colors.sky }] },
];

// Finds a stamp by id, including bonus stamps (falls back to the heart).
export function getStamp(id: string | undefined): StampDef {
  return STAMPS.find((s) => s.id === id) ?? BONUS_STAMPS.find((s) => s.id === id) ?? STAMPS[0];
}
