// A sticker on the decorate page that the kid can drag around.
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { StickerView } from '@/components/kid/StickerView';
import type { Placement } from '@/games/rewards/renderDecorate';

export interface PlacedStickerProps {
  placement: Placement;
  width: number;
  height: number;
  onMove: (key: string, x: number, y: number) => void;
}

// Draggable sticker positioned by its center.
export function PlacedSticker({ placement: p, width, height, onMove }: PlacedStickerProps) {
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const size = p.size * width;
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      dx.set(e.translationX);
      dy.set(e.translationY);
    })
    .onEnd((e) => {
      onMove(p.key, Math.min(1, Math.max(0, p.x + e.translationX / width)), Math.min(1, Math.max(0, p.y + e.translationY / height)));
      dx.set(0);
      dy.set(0);
    });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: dx.get() }, { translateY: dy.get() }] }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ position: 'absolute', left: p.x * width - size / 2, top: p.y * height - size / 2 }, style]}>
        <StickerView id={p.stickerId} size={size} />
      </Animated.View>
    </GestureDetector>
  );
}
