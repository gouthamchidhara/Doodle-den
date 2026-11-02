// Ramps & Rollers (A5): Draw mode (marker, size L) makes ramps; Play mode drops balls that roll into the bucket.
import { useKeepAwake } from 'expo-keep-awake';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawingCanvas, type DrawingCanvasHandle } from '@/canvas/DrawingCanvas';
import { ChipTabs } from '@/components/kid/ChipTabs';
import { PaletteBar } from '@/components/kid/draw/PaletteBar';
import { IconButton } from '@/components/kid/IconButton';
import { UndoIcon } from '@/components/kid/icons/UndoIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SparkleBurst } from '@/components/kid/SparkleBurst';
import { RampsPlay } from '@/games/ramps/RampsPlay';
import { checkRewards } from '@/games/rewards/rewardEngine';
import { playSound } from '@/services/audio';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useDrawingSession } from './shared/useDrawingSession';
import { useIntroVoice } from './shared/useIntroVoice';

type Mode = 'draw' | 'play';

// Ramps screen.
export function RampsScreen() {
  useKeepAwake();
  const { isTablet } = useLayout();
  useIntroVoice('intro_ramps');
  const s = useDrawingSession({ activity: 'ramps' });
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [bucketX] = useState(() => 0.2 + Math.random() * 0.6);
  const [resetKey, setResetKey] = useState(0);
  const [party, setParty] = useState(0);

  const landed = () => {
    playSound('star');
    setParty((n) => n + 1);
    if (s.kidId) void checkRewards(s.kidId, 'RAMPS_BUCKET');
  };

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <View style={styles.root}>
        <KidHeader
          left={mode === 'draw' ? <IconButton size={isTablet ? 64 : 52} icon={<UndoIcon />} accessibilityLabel="Undo" onPress={() => canvasRef.current?.undo()} /> : null}
          right={mode === 'play' ? <PrimaryButton label="Reset balls" tone="tomato" onPress={() => setResetKey((n) => n + 1)} /> : null}
        />
        <View style={styles.center}>
          <ChipTabs
            tabs={[
              { key: 'draw', label: 'Draw' },
              { key: 'play', label: 'Play' },
            ]}
            selected={mode}
            onSelect={setMode}
          />
        </View>
        <View testID="ramps-area" style={[styles.panel, styles.grow]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          {box.w > 0 && mode === 'draw' ? (
            <DrawingCanvas ref={canvasRef} doc={s.doc} onChange={s.setDoc} onStrokeStart={s.markStarted} tool="marker" color={s.color} size="L" />
          ) : null}
          {box.w > 0 && mode === 'play' ? <RampsPlay doc={s.doc} width={box.w} height={box.h} bucketX={bucketX} resetKey={resetKey} onLanded={landed} /> : null}
          {party > 0 ? <SparkleBurst key={party} radius={120} /> : null}
        </View>
        {mode === 'draw' ? (
          <View style={[styles.panel, styles.tray]}>
            <PaletteBar selected={s.color === 'rainbow' || s.color === 'white' ? 'black' : s.color} onSelect={s.setColor} custom={s.custom} showRainbow={false} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  root: { flex: 1, gap: space.md },
  center: { alignItems: 'center' },
  grow: { flex: 1 },
  panel: { backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, overflow: 'hidden' },
  tray: { paddingVertical: space.md },
});
