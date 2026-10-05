// Draws one stamp (same vector data as the canvas) for the stamp picker.
import Svg, { Path } from 'react-native-svg';

import { getStamp } from '@/canvas/stamps';
import { colors } from '@/theme/tokens';

// Stamp image at the given size.
export function StampPreview({ id, size = 44 }: { id: string; size?: number }) {
  const stamp = getStamp(id);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {stamp.shapes.map((s, i) => (
        <Path key={i} d={s.d} fill={s.fill} stroke={colors.ink} strokeWidth={4} strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
