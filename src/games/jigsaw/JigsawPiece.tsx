// One draggable jigsaw piece: the picture clipped by its tab/blank path; snaps home within 24 px.
import { Canvas, Group, Image, Path, Skia, type SkImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

export interface JigsawPieceProps {
  image: SkImage;
  path: string;
  row: number;
  col: number;
  cellW: number;
  cellH: number;
  pad: number;
  boardW: number;
  boardH: number;
  x: number;
  y: number;
  locked: boolean;
  onDrop: (x: number, y: number) => void;
  onLift: () => void;
}

// Piece view.
export function JigsawPiece({ image, path, row, col, cellW, cellH, pad, boardW, boardH, x, y, locked, onDrop, onLift }: JigsawPieceProps) {
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const skPath = useMemo(() => Skia.Path.MakeFromSVGString(path), [path]);
  const w = cellW + pad * 2;
  const h = cellH + pad * 2;
  const pan = Gesture.Pan()
    .enabled(!locked)
    .runOnJS(true)
    .onBegin(onLift)
    .onUpdate((e) => {
      dx.set(e.translationX);
      dy.set(e.translationY);
    })
    .onEnd((e) => {
      onDrop(x + e.translationX, y + e.translationY);
      dx.set(0);
      dy.set(0);
    });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: dx.get() }, { translateY: dy.get() }] }));
  if (!skPath) return null;
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ position: 'absolute', left: x, top: y, width: w, height: h }, style]} accessibilityLabel={locked ? 'Placed piece' : 'Puzzle piece'}>
        <Canvas style={{ width: w, height: h }}>
          <Group clip={skPath}>
            <Image image={image} x={pad - col * cellW} y={pad - row * cellH} width={boardW} height={boardH} fit="fill" />
          </Group>
          <Path path={skPath} style="stroke" strokeWidth={locked ? 1 : 2.5} color={locked ? colors.borderSoft : colors.ink} />
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}
