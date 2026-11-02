// Zoo world (A5): animals walk three depth lines with idle hops; Snack makes everyone hop to the treat.
import { useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { IconButton } from '@/components/kid/IconButton';
import { WORLDS } from '@/games/worlds/worldConfig';
import { WorldScreen } from '@/games/worlds/WorldScreen';
import { animalMotion, drawOrder } from '@/games/worlds/zoo/animalMotion';
import { ZooBackground } from '@/games/worlds/zoo/ZooBackground';
import { playSound } from '@/services/audio';
import { colors } from '@/theme/tokens';

import { useIntroVoice } from './shared/useIntroVoice';

const cfg = WORLDS.zoo;

// Apple-shaped snack icon.
function SnackIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={19} r={10} fill={colors.tomato} stroke={colors.ink} strokeWidth={2.5} />
      <Path d="M16 9c0-3 2-5 5-5" stroke={colors.leaf} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

// Zoo screen.
export function ZooScreen() {
  useIntroVoice('intro_zoo');
  const ext = useSharedValue<number[]>([]);
  const clock = useSharedValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [treat, setTreat] = useState<number | null>(null);

  const snack = () => {
    if (size.w === 0) return;
    const x = size.w * (0.25 + Math.random() * 0.5);
    ext.set([x, clock.get()]);
    setTreat(x);
    playSound('hop');
  };

  return (
    <WorldScreen
      cfg={cfg}
      motion={animalMotion}
      ext={ext}
      clock={clock}
      drawOrder={drawOrder}
      onSize={(w, h) => setSize({ w, h })}
      background={(w, h) => <ZooBackground width={w} height={h} />}
      foreground={(w, h) =>
        treat !== null ? (
          <Svg pointerEvents="none" width={w} height={h} style={{ position: 'absolute' }}>
            <Circle cx={treat} cy={h * 0.95} r={14} fill={colors.tomato} stroke={colors.ink} strokeWidth={3} />
          </Svg>
        ) : null
      }
      extraButton={<IconButton icon={<SnackIcon />} accessibilityLabel="Give a snack" onPress={snack} />}
    />
  );
}
