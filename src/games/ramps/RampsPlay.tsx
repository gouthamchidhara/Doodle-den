// Ramps Play mode: runs the physics at a fixed 1/60 s step and draws ramps, bucket and balls with Skia.
import { Canvas, Circle, createPicture, Group, Path, Picture, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { canvasUnit } from '@/canvas/brushes/brushSpecs';
import { drawStrokes } from '@/canvas/renderStroke';
import { denormalize } from '@/canvas/strokeModel';
import { PressableScale } from '@/components/kid/PressableScale';
import { colors, space } from '@/theme/tokens';
import type { StrokeDoc } from '@/types/models';

import { BALL_R_M, PX_PER_M, RampsWorld, type BallView } from './rampsWorld';

export const DROP_SPOTS = [0.2, 0.5, 0.8] as const;

export interface RampsPlayProps {
  doc: StrokeDoc;
  width: number;
  height: number;
  bucketX: number;
  resetKey: number;
  onLanded: () => void;
}

const R = BALL_R_M * PX_PER_M;

// One ball skin: ball, orange, round cat.
function BallSkin({ b }: { b: BallView }) {
  const ears = useMemo(() => Skia.Path.MakeFromSVGString(`M${-R * 0.8} ${-R * 0.5}L${-R * 0.6} ${-R * 1.3}L${-R * 0.1} ${-R * 0.9}ZM${R * 0.8} ${-R * 0.5}L${R * 0.6} ${-R * 1.3}L${R * 0.1} ${-R * 0.9}Z`), []);
  const fill = b.skin === 'orange' ? colors.orange : b.skin === 'cat' ? colors.sun : colors.sky;
  return (
    <Group transform={[{ translateX: b.x }, { translateY: b.y }, { rotate: b.angle }]}>
      {b.skin === 'cat' && ears ? <Path path={ears} color={colors.sun} /> : null}
      <Circle cx={0} cy={0} r={R} color={fill} />
      <Circle cx={0} cy={0} r={R} color={colors.ink} style="stroke" strokeWidth={3} />
      {b.skin === 'ball' ? <Path path={`M${-R} 0H${R}`} color={colors.white} style="stroke" strokeWidth={5} /> : null}
      {b.skin === 'cat' ? (
        <>
          <Circle cx={-R * 0.35} cy={-R * 0.15} r={R * 0.12} color={colors.ink} />
          <Circle cx={R * 0.35} cy={-R * 0.15} r={R * 0.12} color={colors.ink} />
        </>
      ) : null}
      {b.skin === 'orange' ? <Circle cx={0} cy={-R * 0.85} r={R * 0.18} color={colors.leaf} /> : null}
    </Group>
  );
}

// The play view.
export function RampsPlay({ doc, width, height, bucketX, resetKey, onLanded }: RampsPlayProps) {
  const [balls, setBalls] = useState<BallView[]>([]);
  const world = useMemo(() => {
    const w = new RampsWorld(width, height, bucketX);
    for (const s of doc.strokes) w.addRamp(s.points.map((p) => denormalize(p, width, height)));
    return w;
  }, [doc, width, height, bucketX]);
  const landedCb = useRef(onLanded);
  useEffect(() => {
    landedCb.current = onLanded;
  });

  useEffect(() => {
    world.reset();
    setBalls([]);
  }, [world, resetKey]);

  useEffect(() => {
    let last = Date.now();
    let raf = requestAnimationFrame(function loop() {
      const now = Date.now();
      const landed = world.advance((now - last) / 1000);
      last = now;
      if (landed.length > 0) landedCb.current();
      setBalls(world.view());
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [world]);

  const ramps = useMemo(() => createPicture((c) => drawStrokes(c, doc.strokes, { width, height, unit: canvasUnit(width, height) }), { width, height }), [doc, width, height]);
  const b = world.bucket;
  const bucketPath = `M${b.x - b.w / 2} ${b.y}V${b.y + b.h}H${b.x + b.w / 2}V${b.y}`;

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        <Picture picture={ramps} />
        <Path path={`${bucketPath}Z`} color={colors.tint.sun.fill} />
        <Path path={bucketPath} color={colors.ink} style="stroke" strokeWidth={8} strokeJoin="round" />
        {balls.map((x) => (
          <BallSkin key={x.id} b={x} />
        ))}
      </Canvas>
      <View style={styles.spots} pointerEvents="box-none">
        {DROP_SPOTS.map((f) => (
          <PressableScale key={f} accessibilityLabel="Drop a ball" sound="bubble" onPress={() => world.dropBall(f * width)} style={[styles.arrow, { left: f * width - 28 }]}>
            <Canvas style={styles.arrowCanvas}>
              <Path path="M8 10H48L28 46Z" color={colors.tomato} />
            </Canvas>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spots: { position: 'absolute', left: 0, right: 0, top: space.xs, height: 60 },
  arrow: { position: 'absolute', width: 56, height: 56 },
  arrowCanvas: { width: 56, height: 56 },
});
