// Round animal avatar drawn with SVG.
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { AVATARS, toAvatarId } from '@/content/avatars';
import { colors } from '@/theme/tokens';

export interface AvatarProps {
  id: string;
  size?: number;
}

// Simple animal face: ears by type, round face, eyes, nose and smile.
export function Avatar({ id, size = 64 }: AvatarProps) {
  const a = AVATARS[toAvatarId(id)];
  const ink = colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`${a.label} avatar`}>
      <Circle cx={50} cy={50} r={48} fill={colors.tint.leaf.fill} />
      {a.ears === 'pointy' ? <Path d="M22 40L28 12 46 30M78 40L72 12 54 30" fill={a.ear} stroke={ink} strokeWidth={4} strokeLinejoin="round" /> : null}
      {a.ears === 'round' ? (
        <>
          <Circle cx={27} cy={28} r={11} fill={a.ear} stroke={ink} strokeWidth={4} />
          <Circle cx={73} cy={28} r={11} fill={a.ear} stroke={ink} strokeWidth={4} />
        </>
      ) : null}
      {a.ears === 'long' ? (
        <>
          <Ellipse cx={36} cy={20} rx={8} ry={18} fill={a.ear} stroke={ink} strokeWidth={4} />
          <Ellipse cx={64} cy={20} rx={8} ry={18} fill={a.ear} stroke={ink} strokeWidth={4} />
        </>
      ) : null}
      {a.ears === 'tufts' ? <Path d="M26 34L24 16 40 28M74 34L76 16 60 28" fill={a.ear} stroke={ink} strokeWidth={4} strokeLinejoin="round" /> : null}
      <Circle cx={50} cy={55} r={30} fill={a.face} stroke={ink} strokeWidth={4} />
      <Circle cx={40} cy={50} r={4} fill={ink} />
      <Circle cx={60} cy={50} r={4} fill={ink} />
      <Circle cx={50} cy={60} r={3.5} fill={ink} />
      <Path d="M42 66c5 5 11 5 16 0" stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
