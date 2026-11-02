// Paper Comes Alive (A5): camera (permission via the Parent Gate) → key out white paper → crop → pick a world or just save.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveArtworkFiles } from '@/canvas/saveArtwork';
import { Checkerboard } from '@/components/kid/Checkerboard';
import { ChoiceBubble } from '@/components/kid/ChoiceBubble';
import { KidHeader } from '@/components/kid/KidHeader';
import { Mascot } from '@/components/kid/Mascot';
import { PressableScale } from '@/components/kid/PressableScale';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { pngAtLongEdge, processPhoto } from '@/games/paper/processPhoto';
import { addCreature, randomCreatureName } from '@/games/worlds/addCreature';
import { WORLDS, type PlayWorld } from '@/games/worlds/worldConfig';
import { playSound } from '@/services/audio';
import { isParentUnlocked } from '@/state/parentStore';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';

type Phase = 'camera' | 'working' | 'result' | 'nodrawing' | 'saved';

// Paper screen.
export function PaperScreen() {
  const { isTablet, width, height } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  const params = useLocalSearchParams<{ granted?: string }>();
  useIntroVoice('intro_paper');
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('camera');
  const [result, setResult] = useState<{ png: string; width: number; height: number } | null>(null);

  useEffect(() => {
    if (perm && !perm.granted && params.granted === '1' && isParentUnlocked()) requestPerm().catch(() => undefined);
  }, [perm, params.granted, requestPerm]);

  const shoot = async () => {
    const pic = await cam.current?.takePictureAsync({ quality: 0.9 });
    if (!pic) return;
    playSound('click');
    setPhase('working');
    const r = await processPhoto(pic.uri, pic.width, pic.height);
    if (r.ok) {
      setResult({ png: r.png, width: r.width, height: r.height });
      setPhase('result');
    } else setPhase('nodrawing');
  };

  const keep = async (world: PlayWorld | null) => {
    if (!kidId || !result) return;
    const r = result;
    const artworkId = await saveArtworkFiles({ kidId, activity: 'paper', doc: null, durationSec: 0, exportPng: async (le) => pngAtLongEdge(r.png, r.width, r.height, le) });
    playSound('save-sparkle');
    if (!world) {
      setPhase('saved');
      return;
    }
    const entityId = await addCreature(kidId, world, artworkId, randomCreatureName(), { fromPaper: true });
    router.replace({ pathname: WORLDS[world].route, params: { enter: entityId } });
  };

  if (perm && !perm.granted) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Mascot mood="idle" />
        <SpeechBubble text="Ask a grown-up to let me use the camera." voiceClip="mascot_ask_camera" />
        <PrimaryButton label="Grown-ups" onPress={() => router.push({ pathname: '/parent/gate', params: { next: '/paper?granted=1' } })} />
      </SafeAreaView>
    );
  }

  const frameW = Math.min(width * 0.8, isTablet ? 700 : width - space.xl * 2);
  const frameH = Math.min(height * 0.55, frameW * 0.75);
  return (
    <View style={styles.screen}>
      {phase === 'camera' || phase === 'working' ? (
        <>
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
          <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <View style={styles.pad}>
              <KidHeader />
            </View>
            <View pointerEvents="none" style={styles.center}>
              <View style={[styles.frame, { width: frameW, height: frameH }]} />
              <Text style={styles.hint}>Put your drawing inside</Text>
            </View>
            <View style={styles.shutterRow}>
              <PressableScale accessibilityLabel="Take the picture" disabled={phase === 'working'} onPress={() => void shoot()} style={styles.shutter}>
                <View style={styles.shutterInner} />
              </PressableScale>
            </View>
          </SafeAreaView>
        </>
      ) : (
        <SafeAreaView style={[styles.screen, styles.pad]}>
          <KidHeader />
          <View style={styles.center}>
            {phase === 'nodrawing' ? (
              <>
                <Mascot mood="idle" />
                <SpeechBubble text="I can't see a drawing. Try darker colors!" voiceClip="mascot_no_drawing_seen" />
                <PrimaryButton label="Try again" onPress={() => setPhase('camera')} />
              </>
            ) : result ? (
              <View style={[styles.result, { width: frameW, height: frameH }]}>
                <Checkerboard />
                <Image source={{ uri: `data:image/png;base64,${result.png}` }} style={StyleSheet.absoluteFill} resizeMode="contain" accessibilityLabel="My paper drawing" />
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      )}
      {phase === 'result' ? (
        <ChoiceBubble
          text="Where should it go?"
          choices={[
            { label: 'Aquarium', onPress: () => void keep('aquarium') },
            { label: 'Zoo', onPress: () => void keep('zoo') },
            { label: 'Racetrack', onPress: () => void keep('racetrack') },
            { label: 'Just save', tone: 'tomato', onPress: () => void keep(null) },
          ]}
        />
      ) : null}
      {phase === 'saved' ? (
        <ChoiceBubble
          text="Beautiful!"
          voiceClip="mascot_beautiful"
          choices={[
            { label: 'Another one', onPress: () => setPhase('camera') },
            { label: 'My Gallery', onPress: () => router.replace('/gallery') },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  pad: { padding: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  frame: { borderWidth: border.thick, borderColor: colors.white, borderStyle: 'dashed', borderRadius: radius.panel },
  hint: { fontFamily: fonts.display, fontSize: fontSize.bubble, color: colors.white, backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, overflow: 'hidden' },
  shutterRow: { alignItems: 'center', paddingBottom: space.xxl },
  shutter: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: border.thick, borderColor: colors.ink },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.tomato },
  result: { borderRadius: radius.panel, overflow: 'hidden', borderWidth: border.normal, borderColor: colors.borderSoft },
});
