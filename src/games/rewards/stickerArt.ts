// Sticker designs (placeholders until owner art, T-103): a colored badge with one stamp shape, chosen from the id.
import { BONUS_STAMPS, STAMPS, type StampShape } from '@/canvas/stamps';
import { getReward } from '@/content/rewards';
import { hashString } from '@/canvas/strokeModel';
import { colors } from '@/theme/tokens';

const BADGES = [colors.tint.sun.fill, colors.tint.sky.fill, colors.tint.leaf.fill, colors.tint.grape.fill, colors.tint.pink.fill, colors.tint.orange.fill, colors.tint.tomato.fill];

export interface StickerArt {
  badge: string;
  shapes: StampShape[];
}

// Art for a reward id; bonus-stamp rewards show their stamp.
export function stickerArt(id: string): StickerArt {
  const h = hashString(id);
  const bonus = getReward(id)?.bonusStamp;
  const stamp = (bonus && BONUS_STAMPS.find((s) => s.id === bonus)) || STAMPS[h % STAMPS.length];
  return { badge: BADGES[(h >>> 4) % BADGES.length], shapes: stamp.shapes };
}
