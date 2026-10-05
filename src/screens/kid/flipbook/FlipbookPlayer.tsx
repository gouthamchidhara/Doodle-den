// Looping playback overlay for a flipbook (tap anywhere to close).
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { frameAt, type Fps } from '@/games/flipbook/flipbookModel';
import { overlays } from '@/theme/tokens';
import type { StrokeDoc } from '@/types/models';

import { FrameThumb } from './FrameThumb';

export interface FlipbookPlayerProps {
  frames: StrokeDoc[];
  fps: Fps;
  width: number;
  onClose: () => void;
}

// Full-screen dim with the animation in the middle.
export function FlipbookPlayer({ frames, fps, width, onClose }: FlipbookPlayerProps) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setT(Date.now() - start), 1000 / fps / 2);
    return () => clearInterval(timer);
  }, [fps]);
  const doc = frames[frameAt(t, fps, frames.length)];
  return (
    <Pressable accessibilityLabel="Stop playing" onPress={onClose} style={[StyleSheet.absoluteFill, styles.dim]}>
      {doc ? <FrameThumb doc={doc} width={width} height={width / (doc.aspect || 1)} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: overlays.scrim, alignItems: 'center', justifyContent: 'center' },
});
