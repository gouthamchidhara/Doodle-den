// One sticker: round badge + shape; unearned stickers are soft gray silhouettes (no "locked" text).
import { Image } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { stickerArt } from '@/games/rewards/stickerArt';
import { colors } from '@/theme/tokens';

// Sticker art at a size.
export function StickerView({ id, size, earned = true, uri }: { id: string; size: number; earned?: boolean; uri?: string }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="My sticker" />;
  const art = stickerArt(id);
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel={earned ? 'Sticker' : 'Sticker to find'}>
      <Circle cx={60} cy={60} r={56} fill={earned ? art.badge : colors.surfaceMuted} stroke={earned ? colors.white : colors.borderNeutral} strokeWidth={6} />
      <G transform="translate(18 18) scale(0.84)">
        {art.shapes.map((s, i) => (
          <Path key={i} d={s.d} fill={earned ? s.fill : colors.borderNeutral} stroke={earned ? colors.ink : 'none'} strokeWidth={4} strokeLinejoin="round" />
        ))}
      </G>
    </Svg>
  );
}
