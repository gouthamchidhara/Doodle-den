// Sticker Book "Decorate": pick a scene, tap earned stickers to add them, drag them around, save as a drawing.
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { saveArtworkFiles } from '@/canvas/saveArtwork';
import { ChipTabs } from '@/components/kid/ChipTabs';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { StickerView } from '@/components/kid/StickerView';
import { renderDecoratePng, type Placement } from '@/games/rewards/renderDecorate';
import { SCENE_H, SCENE_W, SCENES, type Scene } from '@/games/rewards/scenes';
import { playSound } from '@/services/audio';
import { border, colors, radius, space } from '@/theme/tokens';

import { PlacedSticker } from './PlacedSticker';

export interface DecoratePageProps {
  kidId: string | null;
  earned: string[];
  width: number;
  onSaved: () => void;
}

const STICKER_SIZE = 0.16;
const MAX_ON_PAGE = 30;

// The decorate editor.
export function DecoratePage({ kidId, earned, width, onSaved }: DecoratePageProps) {
  const [scene, setScene] = useState<Scene['id']>('meadow');
  const [placed, setPlaced] = useState<Placement[]>([]);
  const height = (width * SCENE_H) / SCENE_W;

  const add = (stickerId: string) => {
    if (placed.length >= MAX_ON_PAGE) return;
    const n = placed.length;
    setPlaced((p) => [...p, { key: `${stickerId}-${n}`, stickerId, x: 0.3 + ((n * 0.13) % 0.4), y: 0.35 + ((n * 0.17) % 0.3), size: STICKER_SIZE }]);
    playSound('click');
  };

  const move = (key: string, x: number, y: number) => setPlaced((p) => p.map((s) => (s.key === key ? { ...s, x, y } : s)));

  const save = async () => {
    if (!kidId || placed.length === 0) return;
    await saveArtworkFiles({ kidId, activity: 'draw', doc: null, durationSec: 0, exportPng: async (le) => renderDecoratePng(scene, placed, le) });
    playSound('save-sparkle');
    setPlaced([]);
    onSaved();
  };

  const s = SCENES.find((x) => x.id === scene) ?? SCENES[0];
  return (
    <View style={styles.wrap}>
      <ChipTabs tabs={SCENES.map((x) => ({ key: x.id, label: x.label }))} selected={scene} onSelect={setScene} />
      <View style={[styles.page, { width, height }]} accessibilityLabel="Decorate page">
        <Svg width={width} height={height} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
          {s.shapes.map((sh, i) => (
            <Path key={i} d={sh.d} fill={sh.fill} />
          ))}
        </Svg>
        {placed.map((p) => (
          <PlacedSticker key={p.key} placement={p} width={width} height={height} onMove={move} />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray}>
        {earned.map((id) => (
          <PressableScale key={id} accessibilityLabel={`Add ${id}`} onPress={() => add(id)}>
            <StickerView id={id} size={64} />
          </PressableScale>
        ))}
      </ScrollView>
      <PrimaryButton label="Save my page" disabled={placed.length === 0} onPress={() => void save()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.lg },
  page: { borderRadius: radius.panel, borderWidth: border.thick, borderColor: colors.borderSoft, overflow: 'hidden' },
  tray: { gap: space.sm, paddingHorizontal: space.sm },
});
