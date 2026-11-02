// Aquarium world (A5): fish swim, flip at edges, bob; Feed makes the 3 nearest fish steer to the food for 5 s.
import { useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { IconButton } from '@/components/kid/IconButton';
import { AquariumBackground } from '@/games/worlds/aquarium/AquariumBackground';
import { FoodDots } from '@/games/worlds/aquarium/FoodDots';
import { fishMotion, nearestFish } from '@/games/worlds/aquarium/fishMotion';
import { spriteParams } from '@/games/worlds/spriteParams';
import { useWorldCreatures } from '@/games/worlds/useWorldCreatures';
import { WORLDS } from '@/games/worlds/worldConfig';
import { WorldScreen } from '@/games/worlds/WorldScreen';
import { playSound } from '@/services/audio';
import { colors } from '@/theme/tokens';

import { useIntroVoice } from './shared/useIntroVoice';

const cfg = WORLDS.aquarium;

// Food icon for the Feed button.
function FoodIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={10} cy={12} r={3} fill={colors.orange} />
      <Circle cx={18} cy={8} r={3} fill={colors.orange} />
      <Circle cx={22} cy={16} r={3} fill={colors.orange} />
      <Circle cx={12} cy={21} r={3} fill={colors.orange} />
    </Svg>
  );
}

// Aquarium screen.
export function AquariumScreen() {
  useIntroVoice('intro_aquarium');
  const ext = useSharedValue<number[]>([]);
  const clock = useSharedValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [feed, setFeed] = useState<{ x: number; y: number; n: number } | null>(null);
  const { onScreen } = useWorldCreatures(cfg.key, cfg.max);

  const doFeed = () => {
    if (size.w === 0) return;
    const fx = size.w * (0.3 + Math.random() * 0.4);
    const fy = size.h * 0.45;
    const t = clock.get();
    const near = nearestFish(onScreen.map((c) => spriteParams(c.entity.id)), t, size.w, size.h, fx, fy);
    ext.set([fx, fy, t, near[0] ?? -1, near[1] ?? -1, near[2] ?? -1]);
    setFeed((f) => ({ x: fx, y: fy, n: (f?.n ?? 0) + 1 }));
    playSound('bubble');
  };

  return (
    <WorldScreen
      cfg={cfg}
      motion={fishMotion}
      ext={ext}
      clock={clock}
      onSize={(w, h) => setSize({ w, h })}
      background={(w, h) => <AquariumBackground width={w} height={h} />}
      foreground={() => (feed ? <FoodDots key={feed.n} x={feed.x} y={feed.y} /> : null)}
      extraButton={<IconButton icon={<FoodIcon />} accessibilityLabel="Feed the fish" onPress={doFeed} />}
    />
  );
}
