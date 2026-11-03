// The puzzle: board (with a faint guide in Little mode) and scattered pieces; reports when every piece is home.
import { Canvas, Image, Rect, useImage } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { playSound } from '@/services/audio';
import { colors } from '@/theme/tokens';

import { JigsawPiece } from './JigsawPiece';
import { gridFor, makeEdges, pieceSides, piecePath, scatter, shouldSnap, type PieceCount } from './pieces';

export interface JigsawBoardProps {
  uri: string;
  aspect: number;
  seed: string;
  count: PieceCount;
  width: number;
  height: number;
  guide: boolean;
  onDone: () => void;
}

// Board + pieces sized to the play area (board left on wide screens, top on tall ones).
export function JigsawBoard({ uri, aspect, seed, count, width, height, guide, onDone }: JigsawBoardProps) {
  const image = useImage(uri);
  const wide = width >= height;
  const { rows, cols } = gridFor(count, aspect >= 1);
  const maxW = wide ? width * 0.58 : width * 0.92;
  const maxH = wide ? height * 0.9 : height * 0.55;
  const boardW = Math.min(maxW, maxH * aspect);
  const boardH = boardW / aspect;
  const bx = wide ? width * 0.03 : (width - boardW) / 2;
  const by = wide ? (height - boardH) / 2 : height * 0.02;
  const cellW = boardW / cols;
  const cellH = boardH / rows;
  const pad = Math.min(cellW, cellH) * 0.3;
  const edges = useMemo(() => makeEdges(`${seed}-${count}`, rows, cols), [seed, count, rows, cols]);
  const trayX = bx + boardW + width * 0.03;
  const tray = wide ? { x: trayX, y: 0, w: width - trayX, h: height } : { x: 0, y: by + boardH + 12, w: width, h: height - (by + boardH + 12) };
  const pieces = useMemo(
    () =>
      Array.from({ length: rows * cols }, (_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return { row, col, path: piecePath(cellW, cellH, pad, pieceSides(edges, row, col, rows, cols)), home: { x: bx + col * cellW - pad, y: by + row * cellH - pad } };
      }),
    [rows, cols, cellW, cellH, pad, edges, bx, by],
  );
  const [pos, setPos] = useState(() => scatter(seed, rows * cols, tray, cellW + pad * 2, cellH + pad * 2));
  const [locked, setLocked] = useState<boolean[]>(() => pieces.map(() => false));
  const [top, setTop] = useState<number[]>(() => pieces.map((_, i) => i));

  const drop = (i: number, x: number, y: number) => {
    const p = pieces[i];
    if (!shouldSnap(x, y, p.home.x, p.home.y)) {
      setPos((ps) => ps.map((q, k) => (k === i ? { x, y } : q)));
      return;
    }
    playSound('click');
    setPos((ps) => ps.map((q, k) => (k === i ? p.home : q)));
    const next = locked.map((l, k) => (k === i ? true : l));
    setLocked(next);
    if (next.every(Boolean)) setTimeout(onDone, 300);
  };

  const lift = (i: number) => setTop((t) => [...t.filter((k) => k !== i), i]);
  // Placed pieces underneath, loose pieces on top in the order they were last touched.
  const order = [...top].sort((a, b) => Number(locked[b]) - Number(locked[a]) || top.indexOf(a) - top.indexOf(b));

  if (!image) return <View style={{ width, height }} />;
  return (
    <View style={{ width, height }}>
      <Canvas style={[styles.board, { left: bx, top: by, width: boardW, height: boardH }]}>
        <Rect x={0} y={0} width={boardW} height={boardH} color={colors.surface} />
        {guide ? <Image image={image} x={0} y={0} width={boardW} height={boardH} fit="fill" opacity={0.15} /> : null}
      </Canvas>
      {order.map((i) => (
        <JigsawPiece
          key={i}
          image={image}
          path={pieces[i].path}
          row={pieces[i].row}
          col={pieces[i].col}
          cellW={cellW}
          cellH={cellH}
          pad={pad}
          boardW={boardW}
          boardH={boardH}
          x={pos[i].x}
          y={pos[i].y}
          locked={locked[i]}
          onDrop={(x, y) => drop(i, x, y)}
          onLift={() => lift(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { position: 'absolute', borderRadius: 8 },
});
