// The 3 Sticker Book decorate backgrounds, as shapes in a 400×300 box (drawn by react-native-svg and by Skia on save).
import type { StampShape } from '@/canvas/stamps';
import { colors } from '@/theme/tokens';

export const SCENE_W = 400;
export const SCENE_H = 300;

export interface Scene {
  id: 'meadow' | 'sea' | 'space';
  label: string;
  shapes: StampShape[];
}

const stars = 'M60 40h4v4h-4zM140 70h4v4h-4zM220 30h4v4h-4zM300 80h4v4h-4zM360 30h4v4h-4zM100 150h4v4h-4zM260 140h4v4h-4zM40 220h4v4h-4zM340 200h4v4h-4z';

export const SCENES: Scene[] = [
  {
    id: 'meadow',
    label: 'Meadow',
    shapes: [
      { d: 'M0 0h400v300H0z', fill: colors.tint.sky.fill },
      { d: 'M0 210c80-40 160-40 220-10s120 20 180-10v110H0z', fill: colors.leaf },
      { d: 'M330 30a30 30 0 1 0 0.1 0z', fill: colors.sun },
    ],
  },
  {
    id: 'sea',
    label: 'Under the sea',
    shapes: [
      { d: 'M0 0h400v300H0z', fill: colors.water },
      { d: 'M0 250c60-20 120-20 200 0s140 20 200 0v50H0z', fill: colors.sand },
      { d: 'M0 0h400v30c-60 10-120 10-200 0S60-10 0 10z', fill: colors.waterLight },
    ],
  },
  {
    id: 'space',
    label: 'Space',
    shapes: [
      { d: 'M0 0h400v300H0z', fill: colors.night },
      { d: stars, fill: colors.moon },
      { d: 'M60 230a50 50 0 1 0 0.1 0z', fill: colors.grape },
    ],
  },
];

// Scene by id (falls back to the meadow).
export function getScene(id: string): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
