// The live scene: background + creatures moved by the world's motion worklet on the UI thread.
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { playVoiceClip } from '@/games/voice/playVoice';
import { playSound, type SoundName } from '@/services/audio';

import { Sprite } from './Sprite';
import type { Creature, MotionFn } from './types';

export const SPRITE_H_FRACTION = 0.16; // A5: 14–18% of screen height
const NAME_MS = 2000;

export interface WorldSceneProps {
  creatures: Creature[];
  motion: MotionFn;
  background: (w: number, h: number) => ReactNode;
  foreground?: (w: number, h: number) => ReactNode;
  sound: SoundName;
  ext: SharedValue<number[]>;
  enteringId?: string | null;
  screenH: number;
  onLongPress: (c: Creature) => void;
  onSize?: (w: number, h: number) => void;
}

// Scene component.
export function WorldScene({ creatures, motion, background, foreground, sound, ext, enteringId, screenH, onLongPress, onSize }: WorldSceneProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [named, setNamed] = useState<string | null>(null);
  const clock = useSharedValue(0);
  useFrameCallback((f) => {
    clock.set(f.timeSinceFirstFrame / 1000);
  });

  const tap = (c: Creature) => {
    playSound(sound);
    setNamed(c.entity.id);
    setTimeout(() => setNamed((n) => (n === c.entity.id ? null : n)), NAME_MS);
    if (c.entity.voiceClipId) playVoiceClip(c.entity.voiceClipId).catch((e: unknown) => console.warn('[world] voice failed', e));
  };

  return (
    <View
      style={styles.scene}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: width, h: height });
        onSize?.(width, height);
      }}
    >
      {size.w > 0 ? background(size.w, size.h) : null}
      {size.w > 0
        ? creatures.map((c, i) => (
            <Sprite
              key={c.entity.id}
              creature={c}
              index={i}
              count={creatures.length}
              clock={clock}
              ext={ext}
              motion={motion}
              width={size.w}
              height={size.h}
              spriteH={screenH * SPRITE_H_FRACTION}
              showName={named === c.entity.id}
              entering={enteringId === c.entity.id}
              onTap={tap}
              onLongPress={onLongPress}
            />
          ))
        : null}
      {size.w > 0 && foreground ? foreground(size.w, size.h) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, overflow: 'hidden' },
});
