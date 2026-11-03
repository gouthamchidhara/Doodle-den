// The museum show: dark hall, frames light up one by one and replay, creatures parade, blob audience claps.
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ReplayCanvas } from '@/components/kid/ReplayCanvas';
import { SparkleBurst } from '@/components/kid/SparkleBurst';
import { playSound } from '@/services/audio';
import { sayText } from '@/services/voice';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import type { StrokeDoc } from '@/types/models';

import { showLength, showStep } from './museumPlan';

export interface ShowArt {
  id: string;
  uri: string;
  doc: StrokeDoc | null;
}

export interface MuseumShowProps {
  arts: ShowArt[];
  creatures: string[]; // image uris
  nickname: string | undefined;
  width: number;
  height: number;
  onEnd: () => void;
}

// One creature walking across the floor.
function Walker({ uri, i, width }: { uri: string; i: number; width: number }) {
  const x = useSharedValue(-120);
  useEffect(() => {
    x.set(withTiming(width + 120, { duration: 6000 + i * 400, easing: Easing.linear }));
  }, [x, width, i]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() - i * 90 }, { translateY: Math.sin(x.get() / 30) * 4 }] }));
  return <Animated.Image source={{ uri }} style={[styles.walker, style]} resizeMode="contain" />;
}

// One round clapping audience member.
function Blob({ i }: { i: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withRepeat(withSequence(withTiming(-10, { duration: 180 + (i % 3) * 40 }), withTiming(0, { duration: 180 })), -1));
  }, [y, i]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const fill = [colors.tomato, colors.sun, colors.sky, colors.leaf, colors.grape, colors.pink][i % 6];
  return <Animated.View style={[styles.blob, { backgroundColor: fill }, style]} />;
}

// The show.
export function MuseumShow({ arts, creatures, nickname, width, height, onEnd }: MuseumShowProps) {
  const [t, setT] = useState(0);
  const total = showLength(arts.length);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setT(Date.now() - start), 250);
    return () => clearInterval(timer);
  }, []);
  const step = showStep(t, arts.length);
  const lit = step.kind === 'spot' ? step.index : arts.length;

  useEffect(() => {
    if (step.kind === 'applause') {
      playSound('clap');
      sayText(nickname ? `Welcome to ${nickname}'s museum!` : 'Welcome to the museum!');
    }
    if (step.kind === 'end') onEnd();
    // Only when the step kind changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.kind]);

  const cols = Math.min(3, arts.length);
  const frameW = Math.min((width - space.xl * (cols + 1)) / cols, 260);
  const frameH = frameW * 0.75;

  return (
    <View style={[styles.hall, { width, height }]} accessibilityLabel="Museum show">
      <View style={styles.wall}>
        {arts.map((a, i) => (
          <View key={a.id} style={[styles.frame, { width: frameW, height: frameH, opacity: i <= lit ? 1 : 0.25 }, i === lit && styles.spot]}>
            {i === lit && step.kind === 'spot' && a.doc ? (
              <ReplayCanvas doc={a.doc} width={frameW - 16} height={frameH - 16} />
            ) : (
              <Image source={{ uri: a.uri }} style={{ width: frameW - 16, height: frameH - 16 }} resizeMode="contain" />
            )}
          </View>
        ))}
      </View>
      <View style={styles.floor}>
        {step.kind === 'parade' || step.kind === 'applause' ? creatures.map((uri, i) => <Walker key={uri} uri={uri} i={i} width={width} />) : null}
      </View>
      {step.kind === 'applause' ? (
        <>
          <View style={styles.audience}>
            {Array.from({ length: 9 }, (_, i) => (
              <Blob key={i} i={i} />
            ))}
          </View>
          <SparkleBurst radius={width * 0.4} />
          <Text style={styles.welcome}>{nickname ? `Welcome to ${nickname}'s museum!` : 'Welcome to the museum!'}</Text>
        </>
      ) : null}
      <View style={[styles.progress, { width: `${Math.min(100, (t / total) * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hall: { backgroundColor: colors.night, overflow: 'hidden' },
  wall: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.xl, paddingTop: space.xxl },
  frame: { backgroundColor: colors.white, borderWidth: border.thick * 2, borderColor: colors.brown, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  spot: { borderColor: colors.sun, shadowColor: colors.moon, shadowOpacity: 0.9, shadowRadius: 30, elevation: 12 },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 90, height: 110 },
  walker: { position: 'absolute', bottom: 0, width: 110, height: 100 },
  audience: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: space.md },
  blob: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: colors.ink },
  welcome: { position: 'absolute', top: '45%', alignSelf: 'center', fontFamily: fonts.display, fontSize: fontSize.kidHero - 8, color: colors.moon, textAlign: 'center' },
  progress: { position: 'absolute', top: 0, left: 0, height: 4, backgroundColor: colors.moon },
});
