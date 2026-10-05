// Mixing Lab + Name Your Colors (A5): drag paint into the bowl, discover new colors, name and keep them.
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorDot } from '@/components/kid/ColorDot';
import { IconButton } from '@/components/kid/IconButton';
import { SpeakerIcon } from '@/components/kid/icons/SpeakerIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { PaintPot } from '@/components/kid/PaintPot';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SparkleBurst } from '@/components/kid/SparkleBurst';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { addCustomColor, listCustomColors } from '@/db/repositories/colorRepo';
import { isNewColor, MAX_BLOBS, mixBlobs, POTS, type Blob } from '@/games/mixing/mixEngine';
import { playSound } from '@/services/audio';
import { say } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { CustomColor } from '@/types/models';

import { MixingBowl } from './mixing/MixingBowl';
import { NamingPanel } from './mixing/NamingPanel';
import { useIntroVoice } from './shared/useIntroVoice';

// Mixing Lab screen.
export function MixingLabScreen() {
  const { isTablet, width, ageMode } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  const replay = useIntroVoice('intro_mixing');
  const bowlRef = useRef<View>(null);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [custom, setCustom] = useState<CustomColor[]>([]);
  const [showMine, setShowMine] = useState(false);
  const [naming, setNaming] = useState<string | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const result = mixBlobs(blobs);

  useEffect(() => {
    if (!kidId) return;
    listCustomColors(kidId)
      .then(setCustom)
      .catch((e: unknown) => console.warn('[mixing] colors failed', e));
  }, [kidId]);

  const add = (b: Blob) => {
    if (blobs.length >= MAX_BLOBS || naming) return;
    const next = [...blobs, b];
    setBlobs(next);
    playSound('bubble');
    const mixed = mixBlobs(next);
    if (next.length >= 2 && mixed && isNewColor(mixed, custom.map((c) => c.hex))) {
      playSound('new-color');
      say('mascot_new_color');
      setBubble('You made a new color!');
      setBurst((n) => n + 1);
      setNaming(mixed);
    }
  };

  const dropAt = (b: Blob) => (x: number, y: number) => {
    bowlRef.current?.measureInWindow((bx, by, bw, bh) => {
      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) add(b);
    });
  };

  const empty = () => {
    setBlobs([]);
    setNaming(null);
    setBubble(null);
  };

  const save = async (name: string) => {
    if (!kidId || !naming) return;
    const saved = await addCustomColor(kidId, naming, name);
    if (!saved) {
      say('mascot_full_colors');
      setBubble('Your color box is full!');
    } else {
      setCustom((c) => [...c, saved]);
      setBubble(`${name}!`);
      playSound('cheer');
    }
    setNaming(null);
  };

  const bowl = Math.min(isTablet ? 340 : width * 0.62, 360);
  const pot = isTablet ? 104 : 62;

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader right={<IconButton icon={<SpeakerIcon />} accessibilityLabel="Say it again" onPress={replay} />} />
      <ScrollView contentContainerStyle={styles.body}>
        {bubble ? <SpeechBubble text={bubble} /> : null}
        <MixingBowl ref={bowlRef} color={result} blobs={blobs.length} max={MAX_BLOBS} size={bowl} />
        {burst > 0 ? <SparkleBurst key={burst} radius={bowl * 0.7} /> : null}
        <PrimaryButton label="Empty bowl" tone="tomato" onPress={empty} />
        {naming ? <NamingPanel color={naming} big={ageMode === 'big'} onSave={(n) => void save(n)} /> : null}
      </ScrollView>
      {showMine ? (
        <View style={styles.mine}>
          {custom.map((c) => (
            <ColorDot key={c.id} color={{ hex: c.hex, name: c.name }} selected={false} onPress={() => (add({ hex: c.hex }), setShowMine(false))} />
          ))}
        </View>
      ) : null}
      <View style={styles.pots}>
        {POTS.map((p) => (
          <PaintPot key={p.key} label={p.label} hex={p.hex} size={pot} onDrop={dropAt({ pot: p.key })} onTap={() => add({ pot: p.key })} />
        ))}
        {custom.length > 0 ? <PaintPot label="My colors" hex="mine" size={pot} onDrop={() => setShowMine(true)} onTap={() => setShowMine((v) => !v)} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  body: { alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
  pots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: space.md, flexWrap: 'wrap' },
  mine: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'center', backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.md, marginBottom: space.md },
});
