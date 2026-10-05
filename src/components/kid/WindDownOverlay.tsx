// Wind-down banner, 10% dim, finish-drawing button and stretch-break bubble (A5 Wind-down overlay). Never blocks touches.
import { useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WARN_1_SEC } from '@/lock/constants';
import { lockController } from '@/lock/lockRuntime';
import { useLockStore } from '@/lock/lockStore';
import { playSound } from '@/services/audio';
import { say } from '@/services/voice';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, motion, overlays, radius, space } from '@/theme/tokens';

import { MoonIcon } from './icons/MoonIcon';
import { Mascot } from './Mascot';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';
import { SpeechBubble } from './SpeechBubble';

export const WARN5_HIDE_MS = 6000;
export const BREAK_MS = 10_000;
const DRAWING_ROUTES = new Set(['draw', 'coloring', 'guided', 'kaleidoscope', 'flipbook', 'world-draw', 'music', 'ramps', 'paper']);

// True on screens where "Finish my drawing" makes sense.
export function isDrawingRoute(segments: readonly string[]): boolean {
  return segments[0] === '(kid)' && DRAWING_ROUTES.has(segments[1] ?? '');
}

type Stage = 'warn5' | 'warn1' | null;

// Overlay mounted in the kid layout above every kid screen.
export function WindDownOverlay() {
  const remaining = useLockStore((s) => s.remainingSec);
  const ageMode = useSessionStore((s) => s.ageMode);
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>(null);
  const [breakOn, setBreakOn] = useState(false);
  const [finish, setFinish] = useState<'ask' | 'granted' | 'hidden'>('ask');
  const dim = useSharedValue(0);

  useEffect(() => {
    const handle = () => {
      if (useLockStore.getState().events.length === 0) return;
      const taken = useLockStore.getState().takeEvents();
      if (taken.includes('WARN_1')) {
        setStage('warn1');
        setFinish('ask');
        playSound('yawn');
        say('mascot_sleepy');
      } else if (taken.includes('WARN_5')) {
        setStage('warn5');
        playSound('yawn');
        say('mascot_sleepy');
      }
      if (taken.includes('BREAK')) setBreakOn(true);
    };
    const first = setTimeout(handle, 0);
    const unsub = useLockStore.subscribe(handle);
    return () => {
      clearTimeout(first);
      unsub();
    };
  }, []);

  useEffect(() => {
    dim.set(withTiming(stage ? 1 : 0, { duration: motion.windDownDimMs }));
    if (stage !== 'warn5') return undefined;
    const t = setTimeout(() => setStage((s) => (s === 'warn5' ? null : s)), WARN5_HIDE_MS);
    return () => clearTimeout(t);
  }, [stage, dim]);

  useEffect(() => {
    if (!breakOn) return undefined;
    const t = setTimeout(() => setBreakOn(false), BREAK_MS);
    return () => clearTimeout(t);
  }, [breakOn]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.get() }));
  const stale = stage === 'warn1' && remaining !== null && remaining > WARN_1_SEC && finish !== 'granted';
  const visible = stage !== null && !stale;

  const askFinish = async () => {
    const ok = await lockController.finishDrawing();
    setFinish(ok ? 'granted' : 'hidden');
    if (ok) say('mascot_two_more');
  };

  const showFinish = visible && stage === 'warn1' && finish === 'ask' && isDrawingRoute(segments);
  const text = finish === 'granted' && stage === 'warn1' ? 'OK! 2 more minutes.' : 'Getting sleepy… finish your drawing soon!';

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} />
      {visible ? (
        <View pointerEvents="box-none" style={[styles.bannerWrap, { top: insets.top + space.sm }]}>
          <View style={styles.banner} accessibilityRole="alert">
            <Mascot mood="sleepy" size={44} />
            <Text style={styles.text}>{text}</Text>
            {showFinish && ageMode === 'big' ? <PrimaryButton label="Finish my drawing" onPress={() => void askFinish()} /> : null}
            {showFinish && ageMode === 'little' ? (
              <PressableScale accessibilityLabel="Finish my drawing" onPress={() => void askFinish()} style={styles.moon}>
                <MoonIcon size={40} />
              </PressableScale>
            ) : null}
          </View>
        </View>
      ) : null}
      {breakOn ? (
        <View pointerEvents="none" style={[styles.breakWrap, { bottom: insets.bottom + space.xl }]}>
          <Mascot mood="happy" size={72} />
          <SpeechBubble text="Stretch break! Wiggle your arms!" voiceClip="mascot_break" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: overlays.windDownDim },
  bannerWrap: { position: 'absolute', left: space.lg, right: space.lg, alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.tint.sun.fill,
    borderColor: colors.sun,
    borderWidth: border.normal,
    borderRadius: radius.button,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    maxWidth: 760,
  },
  text: { flexShrink: 1, fontFamily: fonts.displayMedium, fontSize: fontSize.body, color: colors.ink },
  moon: { width: 64, height: 64, borderRadius: radius.round, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  breakWrap: { position: 'absolute', left: space.lg, flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
});
