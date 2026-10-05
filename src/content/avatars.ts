// Built-in animal avatars for kid profiles (no photos, ever).
import { colors } from '@/theme/tokens';

export const AVATAR_IDS = ['fox', 'bear', 'cat', 'owl', 'bunny', 'frog', 'panda', 'lion'] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export interface AvatarSpec {
  label: string;
  face: string;
  ear: string;
  ears: 'pointy' | 'round' | 'long' | 'none' | 'tufts';
}

export const AVATARS: Record<AvatarId, AvatarSpec> = {
  fox: { label: 'Fox', face: colors.orange, ear: colors.orange, ears: 'pointy' },
  bear: { label: 'Bear', face: colors.brown, ear: colors.brown, ears: 'round' },
  cat: { label: 'Cat', face: colors.sun, ear: colors.sun, ears: 'pointy' },
  owl: { label: 'Owl', face: colors.grape, ear: colors.grape, ears: 'tufts' },
  bunny: { label: 'Bunny', face: colors.tint.pink.fill, ear: colors.pink, ears: 'long' },
  frog: { label: 'Frog', face: colors.leaf, ear: colors.leaf, ears: 'none' },
  panda: { label: 'Panda', face: colors.white, ear: colors.black, ears: 'round' },
  lion: { label: 'Lion', face: colors.sun, ear: colors.orange, ears: 'round' },
};

// Narrows an unknown string to a known avatar id (fallback fox).
export function toAvatarId(id: string): AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(id) ? (id as AvatarId) : 'fox';
}
